import { t } from "../i18n";
import { UserFacingError } from "./UserFacingError";

type DraftStatus = { status: string; completedSessionId?: string | null };

export async function finishWorkout({ readDraft, save, complete }: {
    readDraft: () => Promise<DraftStatus>;
    save: () => Promise<void>;
    complete: () => Promise<{ _id: string }>;
}): Promise<string> {
    const draft = await readDraft();
    if (draft.status === "completed") {
        if (!draft.completedSessionId) throw new UserFacingError(t("finishWorkout.theCompletedWorkoutCouldNotBeFoundPleaseTry"));
        return draft.completedSessionId;
    }
    if (draft.status !== "active") throw new UserFacingError(t("finishWorkout.thisWorkoutIsNoLongerActive"));
    await save();
    try {
        return (await complete())._id;
    } catch (completionError) {
        const verified = await readDraft().catch(() => {
            throw new UserFacingError(t("finishWorkout.couldNotConfirmWhetherTheWorkoutFinishedYourProgress"));
        });
        if (verified.status !== "completed" || !verified.completedSessionId) throw completionError;
        return verified.completedSessionId;
    }
}
