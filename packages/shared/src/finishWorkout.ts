type DraftStatus = { status: string; completedSessionId?: string | null };
export class FinishWorkoutError extends Error {
  readonly code: "missing-session" | "inactive" | "unconfirmed";
  constructor(code: "missing-session" | "inactive" | "unconfirmed") {
    super(code);
    this.code = code;
  }
}
/** Verify status before writes and recover a lost completion response without resubmitting. */
export async function finishWorkoutTransaction({
  readDraft,
  save,
  complete,
}: {
  readDraft: () => Promise<DraftStatus>;
  save: () => Promise<void>;
  complete: () => Promise<{ _id: string }>;
}): Promise<string> {
  const draft = await readDraft();
  if (draft.status === "completed") {
    if (!draft.completedSessionId)
      throw new FinishWorkoutError("missing-session");
    return draft.completedSessionId;
  }
  if (draft.status !== "active") throw new FinishWorkoutError("inactive");
  await save();
  try {
    return (await complete())._id;
  } catch (error) {
    const verified = await readDraft().catch(() => {
      throw new FinishWorkoutError("unconfirmed");
    });
    if (verified.status !== "completed" || !verified.completedSessionId)
      throw error;
    return verified.completedSessionId;
  }
}
