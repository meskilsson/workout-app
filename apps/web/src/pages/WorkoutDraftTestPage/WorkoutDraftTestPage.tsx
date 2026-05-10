import { useState } from "react";
import {
    completeWorkoutDraftRequest,
    createWorkoutDraftRequest,
    getCurrentWorkoutDraftRequest,
    getWorkoutDraftByIdRequest,
    startWorkoutDraftRequest,
    updateWorkoutDraftExercisesRequest,
    updateWorkoutDraftSetsRequest,
} from "../../services/workoutDraftApi";

export default function WorkoutDraftTestPage() {
    const [draftId, setDraftId] = useState("");
    const [exerciseId, setExerciseId] = useState("");
    const [result, setResult] = useState<unknown>(null);
    const [error, setError] = useState("");

    async function runAction(action: () => Promise<unknown>) {
        try {
            setError("");

            const data = await action();

            setResult(data);

            if (
                data &&
                typeof data === "object" &&
                "_id" in data &&
                typeof data._id === "string"
            ) {
                setDraftId(data._id);
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Something went wrong");
            }
        }
    }

    return (
        <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
            <h1>Workout Draft Test Page</h1>

            <p>
                This is a temporary developer page for testing the backend draft
                flow.
            </p>

            <section style={{ marginBottom: "2rem" }}>
                <h2>Draft ID</h2>

                <input
                    value={draftId}
                    onChange={(event) => setDraftId(event.target.value)}
                    placeholder="Draft ID"
                    style={{ width: "100%", padding: "0.75rem" }}
                />
            </section>

            <section style={{ marginBottom: "2rem" }}>
                <h2>Exercise ID</h2>

                <input
                    value={exerciseId}
                    onChange={(event) => setExerciseId(event.target.value)}
                    placeholder="Paste an exercise ID here"
                    style={{ width: "100%", padding: "0.75rem" }}
                />
            </section>

            <section
                style={{
                    display: "grid",
                    gap: "0.75rem",
                    marginBottom: "2rem",
                }}
            >
                <button
                    onClick={() =>
                        runAction(() =>
                            createWorkoutDraftRequest({
                                selectedMuscleGroups: ["chest"],
                            }),
                        )
                    }
                >
                    1. Create chest draft
                </button>

                <button
                    onClick={() => runAction(getCurrentWorkoutDraftRequest)}
                >
                    2. Get current draft
                </button>

                <button
                    onClick={() =>
                        runAction(() => getWorkoutDraftByIdRequest(draftId))
                    }
                    disabled={!draftId}
                >
                    3. Get draft by ID
                </button>

                <button
                    onClick={() =>
                        runAction(() =>
                            updateWorkoutDraftExercisesRequest(draftId, {
                                exerciseIds: [exerciseId],
                            }),
                        )
                    }
                    disabled={!draftId || !exerciseId}
                >
                    4. Add exercise to draft
                </button>

                <button
                    onClick={() =>
                        runAction(() => startWorkoutDraftRequest(draftId))
                    }
                    disabled={!draftId}
                >
                    5. Start draft
                </button>

                <button
                    onClick={() =>
                        runAction(() =>
                            updateWorkoutDraftSetsRequest(draftId, {
                                exerciseId,
                                sets: [
                                    {
                                        weight: 60,
                                        reps: 10,
                                    },
                                    {
                                        weight: 65,
                                        reps: 8,
                                    },
                                ],
                            }),
                        )
                    }
                    disabled={!draftId || !exerciseId}
                >
                    6. Save sets
                </button>

                <button
                    onClick={() =>
                        runAction(() => completeWorkoutDraftRequest(draftId))
                    }
                    disabled={!draftId}
                >
                    7. Complete draft
                </button>
            </section>

            {error && (
                <section style={{ color: "red", marginBottom: "2rem" }}>
                    <h2>Error</h2>
                    <pre>{error}</pre>
                </section>
            )}

            <section>
                <h2>Response</h2>

                <pre
                    style={{
                        background: "#111",
                        color: "#eee",
                        padding: "1rem",
                        borderRadius: "8px",
                        overflowX: "auto",
                    }}
                >
                    {JSON.stringify(result, null, 2)}
                </pre>
            </section>
        </main>
    );
}