import { useLocation, useNavigate } from "react-router-dom";
import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import { useState, useEffect } from "react";
import Input from "../../components/ui/input/Input";
import Modal from "../../components/ui/modal/Modal";

type SelectedExercises = {
    id: string;
    name: string;
    muscleGroup: string;
}

type LocationState = {
    selectedExercises: SelectedExercises[];
}

type WorkoutSet = {
    weight: string;
    reps: string;
}



export default function WorkoutPage() {

    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState | null;

    const [setsByExercise, setSetsByExercise] = useState<Record<string, WorkoutSet[]>>({});
    const [openModal, setOpenModal] = useState<boolean>(false);

    const EMPTY_EXERCISES: SelectedExercises[] = [];
    const selectedExercises = state?.selectedExercises ?? EMPTY_EXERCISES;


    useEffect(() => {
        setSetsByExercise((prev) => {
            const next = { ...prev };

            selectedExercises.forEach((exercise) => {
                if (!next[exercise.id] || next[exercise.id].length === 0) {
                    next[exercise.id] = [{ weight: "", reps: "" }];
                }
            });

            Object.keys(next).forEach((exerciseId) => {
                const stillSelected = selectedExercises.some((exercise) => exercise.id === exerciseId);
                if (!stillSelected) {
                    delete next[exerciseId];
                }
            });
            return next;
        })
    }, [selectedExercises])


    function handleAddSet(exerciseId: string) {
        setSetsByExercise((prev) => ({
            ...prev,
            [exerciseId]: [...(prev[exerciseId] ?? []), { weight: '', reps: '' }],
        }));
    }

    function handleSetChange(
        exerciseId: string,
        index: number,
        field: 'weight' | 'reps',
        value: string
    ) {
        setSetsByExercise((prev) => ({
            ...prev,
            [exerciseId]: (prev[exerciseId] ?? []).map((set, i) =>
                i === index ? { ...set, [field]: value } : set
            ),
        }));
    }

    function handleRemoveSet(exerciseId: string, index: number) {
        setSetsByExercise((prev) => ({
            ...prev,
            [exerciseId]: (prev[exerciseId] ?? []).filter((_, i) => i !== index),
        }));
    }

    function handleEndSession() {
        setOpenModal(true);
    }

    function handleCloseModal() {
        setOpenModal(false);
    }


    return (

        <Box>
            <Box>
                <Card>
                    {selectedExercises.map((exercise) => {
                        const exerciseSets = setsByExercise[exercise.id] ?? [];

                        return (
                            <Card
                                style={{ listStyle: "none" }}
                                key={exercise.id}>

                                <li>
                                    {exercise.name}
                                    <div style={{ display: "flex", justifyContent: "right" }}>
                                        <Button onClick={() => handleAddSet(exercise.id)}>
                                            Add set
                                        </Button>
                                    </div>
                                </li>

                                <div

                                >
                                    {exerciseSets.map((set, index) => (
                                        <div key={index} className="set-row">
                                            <Input
                                                label={index === 0 ? "Weight" : undefined}
                                                type="number"
                                                min={0}
                                                placeholder="0"
                                                value={set.weight}
                                                wrapperClassName="set-number-wrapper"
                                                className="set-number-input"
                                                onChange={(e) =>
                                                    handleSetChange(exercise.id, index, "weight", e.target.value)
                                                }
                                            />

                                            <Input
                                                label={index === 0 ? "Reps" : undefined}
                                                type="number"
                                                min={0}
                                                placeholder="0"
                                                value={set.reps}
                                                wrapperClassName="set-number-wrapper"
                                                className="set-number-input"
                                                onChange={(e) =>
                                                    handleSetChange(exercise.id, index, "reps", e.target.value)
                                                }
                                            />

                                            <Button
                                                className="set-delete-button"
                                                onClick={() => handleRemoveSet(exercise.id, index)}
                                            >
                                                X
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        );
                    })}
                </Card>

                <Box
                    style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: "20px" }}
                >
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleEndSession}
                    >End Session</Button>
                </Box>

                <Modal
                    title="End session?"
                    isOpen={openModal}
                    onClose={handleCloseModal}
                    actions={
                        <>
                            <Button onClick={() => navigate("/workout-result")}>
                                End Workout
                            </Button>

                            <Button onClick={handleCloseModal}>
                                Close
                            </Button>
                        </>
                    }
                >
                    <p>Are you sure you want to end this workout session?</p>
                </Modal>
            </Box>
        </Box>


    );
}