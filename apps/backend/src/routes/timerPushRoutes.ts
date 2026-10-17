import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { TimerPushJob, TimerPushReceipt, TimerSchedule, TimerSubscription } from '../models/TimerPush';
import WorkoutDraft from '../models/WorkoutDraft';
import { disableDevicePush, PUSH_LIFETIME_MS, timerPushConfig, validPushEndpoint, validPushTime } from '../services/timerPushService';

const router = Router();
router.use(requireAuth);
const device = z.string().uuid();
const draftId = z.string().regex(/^[a-f\d]{24}$/i);
router.get('/config', (_req, res) => {
    const config = timerPushConfig();
    res.json({ enabled: config.enabled, publicKey: config.enabled ? config.publicKey : null });
});
router.post('/subscribe', async (req, res) => {
    if (!timerPushConfig().enabled) { res.status(503).json({ code: 'PUSH_NOT_CONFIGURED' }); return; }
    const body = z.object({ deviceId: device, subscription: z.object({ endpoint: z.string().max(4096).refine(validPushEndpoint),
        keys: z.object({ auth: z.string().regex(/^[\w-]+={0,2}$/).min(16).max(128), p256dh: z.string().regex(/^[\w-]+={0,2}$/).min(32).max(256) }) }) }).safeParse(req.body);
    if (!body.success) { res.status(400).json({ code: 'INVALID_PUSH_SUBSCRIPTION' }); return; }
    const userId = req.user!.id;
    const { deviceId, subscription } = body.data;
    // Reassigning a shared-browser subscription must invalidate its old owner.
    const previous = await TimerSubscription.findOne({ endpoint: subscription.endpoint });
    if (previous && previous.userId.toString() !== userId) await disableDevicePush(previous.userId.toString(), previous.deviceId);
    await TimerSubscription.findOneAndUpdate({ userId, deviceId }, { $set: subscription }, { upsert: true });
    res.json({ enabled: true });
});
router.post('/disable', async (req, res) => {
    const body = z.object({ deviceId: device }).safeParse(req.body);
    if (!body.success) { res.sendStatus(400); return; }
    await disableDevicePush(req.user!.id, body.data.deviceId); res.json({ enabled: false });
});
router.post('/schedule', async (req, res) => {
    const now = Date.now();
    const parsed = z.object({ deviceId: device, draftId, revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), language: z.string().max(12),
        events: z.array(z.object({ id: z.string().min(1).max(160), at: z.number().refine(at => validPushTime(at, now)),
            cue: z.enum(['rest-end', 'work-end', 'activity-end']), exerciseId: draftId.optional() })).max(200) }).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ code: 'INVALID_TIMER_SCHEDULE' }); return; }
    const { deviceId, draftId: workoutId, revision, events, language } = parsed.data;
    const userId = req.user!.id;
    const draft = await WorkoutDraft.findOne({ _id: workoutId, userId });
    if (!draft || (events.length && (draft.status !== 'active' || draft.purpose !== 'workout'))) { res.sendStatus(404); return; }
    if (events.some(event => event.exerciseId && !draft.exercises.some(exercise => exercise.exerciseId.toString() === event.exerciseId))) { res.sendStatus(400); return; }
    if (!await TimerSubscription.exists({ userId, deviceId })) { res.status(409).json({ code: 'PUSH_SUBSCRIPTION_REQUIRED' }); return; }
    const identity = { userId, deviceId, draftId: workoutId };
    let accepted = false;
    try {
        accepted = Boolean(await TimerSchedule.findOneAndUpdate({ ...identity, revision: { $lt: revision } }, { $set: { revision, active: true } }, { upsert: true, returnDocument: 'after' }));
    } catch (error) { if ((error as { code?: number }).code !== 11000) throw error; }
    if (!accepted && !await TimerSchedule.exists({ ...identity, revision, active: true })) { res.json({ accepted: false }); return; }
    // Invalidate other drafts on this device. A previous workout cannot ring later.
    await TimerSchedule.updateMany({ userId, deviceId, draftId: { $ne: workoutId } }, { $set: { active: false } });
    for (const event of events) {
        const nextBoundary = Math.min(...events.filter(next => next.at > event.at).map(next => next.at));
        const expiresAt = Math.min(event.at + PUSH_LIFETIME_MS, nextBoundary);
        if (expiresAt <= Date.now()) continue;
        // An interval cue is obsolete as soon as its following phase ends.
        // Short phases need less acknowledgment grace than long rest timers.
        const grace = Math.min(1000, (expiresAt - event.at) / 4);
        await TimerPushJob.updateOne({ ...identity, eventId: event.id, revision }, { $setOnInsert: {
            ...identity, eventId: event.id, revision, exerciseId: event.exerciseId, cue: event.cue, language,
            at: new Date(event.at), dueAt: new Date(event.at + grace), expiresAt: new Date(expiresAt), purgeAt: new Date(event.at + 86400000), status: 'pending',
        } }, { upsert: true });
    }
    res.json({ accepted: true });
});
router.post('/ack', async (req, res) => {
    const body = z.object({ deviceId: device, draftId, eventId: z.string().max(160) }).safeParse(req.body);
    if (!body.success) { res.sendStatus(400); return; }
    await TimerPushReceipt.updateOne({ userId: req.user!.id, ...body.data }, { $setOnInsert: { expiresAt: new Date(Date.now() + 86400000) } }, { upsert: true });
    await TimerPushJob.updateMany({ userId: req.user!.id, ...body.data, status: { $in: ['pending', 'sending'] } }, { $set: { status: 'acknowledged' } });
    res.json({ acknowledged: true });
});
export default router;
