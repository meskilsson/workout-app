import { UserFacingError } from "./UserFacingError";

type DraftStatus = { status: string; completedSessionId?: string | null };

export async function finishWorkout({ readDraft, save, complete }: {
    readDraft: () => Promise<DraftStatus>;
    save: () => Promise<void>;
    complete: () => Promise<{ _id: string }>;
}): Promise<string> {
    const draft = await readDraft();
    if (draft.status === "completed") {
        if (!draft.completedSessionId) throw new UserFacingError("The completed workout could not be found. Please try again.");
        return draft.completedSessionId;
    }
    if (draft.status !== "active") throw new UserFacingError("This workout is no longer active.");
    await save();
    try {
        return (await complete())._id;
    } catch (completionError) {
        const verified = await readDraft().catch(() => {
            throw new UserFacingError("Could not confirm whether the workout finished. Your progress has been kept. Please try again to check its status.");
        });
        if (verified.status !== "completed" || !verified.completedSessionId) throw completionError;
        return verified.completedSessionId;
    }
}
