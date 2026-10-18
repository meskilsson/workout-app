import { finishWorkoutTransaction, FinishWorkoutError } from "@workout-app/shared";
import { t } from "../i18n";
import { UserFacingError } from "./UserFacingError";

type DraftStatus = { status: string; completedSessionId?: string | null };

export async function finishWorkout({ readDraft, save, complete }: {
    readDraft: () => Promise<DraftStatus>;
    save: () => Promise<void>;
    complete: () => Promise<{ _id: string }>;
}): Promise<string> {
    try { return await finishWorkoutTransaction({ readDraft, save, complete }); }
    catch (error) {
        if (error instanceof FinishWorkoutError) {
            const keys = { 'missing-session': 'finishWorkout.theCompletedWorkoutCouldNotBeFoundPleaseTry', inactive: 'finishWorkout.thisWorkoutIsNoLongerActive', unconfirmed: 'finishWorkout.couldNotConfirmWhetherTheWorkoutFinishedYourProgress' };
            throw new UserFacingError(t(keys[error.code]));
        }
        throw error;
    }
}
