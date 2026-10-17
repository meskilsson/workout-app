import { Schema, model } from 'mongoose';

const subscriptionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    deviceId: { type: String, required: true },
    endpoint: { type: String, required: true, unique: true },
    keys: { auth: { type: String, required: true }, p256dh: { type: String, required: true } },
}, { timestamps: true });
subscriptionSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
export const TimerSubscription = model('TimerSubscription', subscriptionSchema);

const scheduleSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true }, deviceId: { type: String, required: true },
    draftId: { type: Schema.Types.ObjectId, required: true }, revision: { type: Number, required: true },
    active: { type: Boolean, default: true },
});
scheduleSchema.index({ userId: 1, deviceId: 1, draftId: 1 }, { unique: true });
export const TimerSchedule = model('TimerSchedule', scheduleSchema);

const jobSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true }, deviceId: { type: String, required: true },
    draftId: { type: Schema.Types.ObjectId, required: true }, revision: { type: Number, required: true },
    eventId: { type: String, required: true }, exerciseId: String,
    cue: { type: String, enum: ['rest-end', 'work-end', 'activity-end'], required: true },
    language: String, at: { type: Date, required: true }, dueAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true }, purgeAt: { type: Date, required: true },
    status: { type: String, default: 'pending', enum: ['pending', 'sending', 'sent', 'cancelled', 'acknowledged'] }, leaseUntil: Date,
});
jobSchema.index({ userId: 1, deviceId: 1, draftId: 1, eventId: 1, revision: 1 }, { unique: true });
jobSchema.index({ status: 1, dueAt: 1 });
jobSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });
export const TimerPushJob = model('TimerPushJob', jobSchema);

const receiptSchema = new Schema({ userId: { type: Schema.Types.ObjectId, required: true }, deviceId: String, draftId: Schema.Types.ObjectId,
    eventId: String, expiresAt: { type: Date, required: true } });
receiptSchema.index({ userId: 1, deviceId: 1, draftId: 1, eventId: 1 }, { unique: true });
receiptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const TimerPushReceipt = model('TimerPushReceipt', receiptSchema);
