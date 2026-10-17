import webpush from 'web-push';
import { TimerPushJob, TimerPushReceipt, TimerSchedule, TimerSubscription } from '../models/TimerPush';
import WorkoutDraft from '../models/WorkoutDraft';
import User from '../models/User';

export const PUSH_LIFETIME_MS = 5000;
export function timerPushConfig() {
    const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
    const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
    const subject = process.env.WEB_PUSH_SUBJECT;
    return { enabled: Boolean(publicKey && privateKey && subject), publicKey, privateKey, subject };
}
// Do not turn this authenticated API into an arbitrary HTTP/SSRF relay.
export function validPushEndpoint(endpoint: string): boolean {
    try {
        const url = new URL(endpoint);
        return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
            (url.hostname === 'fcm.googleapis.com' || url.hostname === 'updates.push.services.mozilla.com'
                || url.hostname.endsWith('.push.services.mozilla.com') || url.hostname.endsWith('.push.apple.com')
                || url.hostname.endsWith('.notify.windows.com'));
    } catch { return false; }
}
// A slow request may contain expired early intervals alongside valid future ones.
// Accept the bounded timeline, then discard expired jobs rather than reject all.
export function validPushTime(at: number, now: number): boolean { return Number.isFinite(at) && at >= now - 86400000 && at <= now + 86400000; }
export async function disableDevicePush(userId: string, deviceId: string) {
    await TimerSubscription.deleteMany({ userId, deviceId });
    await TimerSchedule.updateMany({ userId, deviceId }, { $set: { active: false } });
    await TimerPushJob.updateMany({ userId, deviceId, status: { $in: ['pending', 'sending'] } }, { $set: { status: 'cancelled' } });
}

export async function deliverNextTimerPush(now = Date.now()): Promise<boolean> {
    const config = timerPushConfig();
    if (!config.enabled) return false;
    const job = await TimerPushJob.findOneAndUpdate({ dueAt: { $lte: new Date(now) }, expiresAt: { $gt: new Date(now) },
        $or: [{ status: 'pending' }, { status: 'sending', leaseUntil: { $lt: new Date(now) } }] },
    { $set: { status: 'sending', leaseUntil: new Date(now + 10000) } }, { returnDocument: 'after', sort: { dueAt: 1 } });
    if (!job) return false;
    const identity = { userId: job.userId, deviceId: job.deviceId, draftId: job.draftId };
    const [schedule, subscription, draft, user] = await Promise.all([
        TimerSchedule.exists({ ...identity, revision: job.revision, active: true }),
        TimerSubscription.findOne({ userId: job.userId, deviceId: job.deviceId }),
        WorkoutDraft.findOne({ _id: job.draftId, userId: job.userId, status: 'active', purpose: 'workout' }),
        User.exists({ _id: job.userId, deletedAt: null }),
    ]);
    if (!schedule || !subscription || !draft || !user || (job.exerciseId && !draft.exercises.some(exercise => exercise.exerciseId.toString() === job.exerciseId))) {
        await TimerPushJob.updateOne({ _id: job._id }, { $set: { status: 'cancelled' } }); return true;
    }
    // A foreground acknowledgment or cancellation may have arrived during reads.
    if (await TimerPushReceipt.exists({ ...identity, eventId: job.eventId }) || !await TimerPushJob.exists({ _id: job._id, status: 'sending' }) ||
        !await TimerSchedule.exists({ ...identity, revision: job.revision, active: true }) || Date.now() >= job.expiresAt.getTime()) return true;
    const sv = job.language?.startsWith('sv');
    const bodies = sv ? { 'rest-end': 'Vilan är slut. Redo för nästa set eller intervall.', 'work-end': 'Arbetsintervallet är klart.', 'activity-end': 'Aktiviteten är klar.' }
        : { 'rest-end': 'Rest is over. Ready for your next effort.', 'work-end': 'Work interval complete.', 'activity-end': 'Activity complete.' };
    try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { auth: subscription.keys!.auth!, p256dh: subscription.keys!.p256dh! } },
            JSON.stringify({ id: job.eventId, title: sv ? 'Träningstimer' : 'Workout timer', body: bodies[job.cue as keyof typeof bodies],
                scope: `workout-progress:${job.userId}:${job.draftId}`, revision: job.revision,
                at: job.at.getTime(), expiresAt: job.expiresAt.getTime(), expiredBody: sv ? 'Öppna passet för aktuell timerstatus.' : 'Open your workout for the current timer.', url: `/workout/${job.draftId}` }),
            { vapidDetails: { subject: config.subject!, publicKey: config.publicKey!, privateKey: config.privateKey! }, TTL: Math.max(0, Math.min(5, Math.floor((job.expiresAt.getTime() - Date.now()) / 1000))), urgency: 'high', timeout: 3000 });
        await TimerPushJob.updateOne({ _id: job._id, status: 'sending' }, { $set: { status: 'sent' } });
    } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await disableDevicePush(job.userId.toString(), job.deviceId);
        else await TimerPushJob.updateOne({ _id: job._id, status: 'sending' }, { $set: { status: 'pending', dueAt: new Date(Date.now() + 1000) } });
    }
    return true;
}

export function startTimerPushScheduler() {
    let busy = false;
    const timer = setInterval(async () => {
        if (busy) return;
        busy = true;
        try { for (let index = 0; index < 20; index++) if (!await deliverNextTimerPush()) break; }
        catch { console.error('Timer push scheduler temporarily unavailable'); }
        finally { busy = false; }
    }, 500);
    timer.unref();
    return () => clearInterval(timer);
}
