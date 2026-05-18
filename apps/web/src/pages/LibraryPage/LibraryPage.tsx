import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import {
    getExerciseLibraryRequest,
    getPublicExercisesRequest,
} from "../../services/exerciseApi";

import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import MuscleDummy from "../../components/muscleDummy/MuscleDummy";
import type { Exercise } from "@workout-app/shared";
import { usePaginationScroll } from "../../hooks/usePaginationScroll";

import styles from "./LibraryPage.module.css";



export default function LibraryPage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);


    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");


    const [limit] = useState(12);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const { page, setPage, pageTopRef, handlePageChange } = usePaginationScroll<HTMLDivElement>(totalPages)

    useEffect(() => {
        async function loadExercises() {
            setError("");
            setIsLoading(true);

            try {

                const options = {
                    page,
                    limit,
                    search: debouncedSearchTerm
                };

                const data = isAuthenticated
                    ? await getExerciseLibraryRequest(options)
                    : await getPublicExercisesRequest(options);

                setExercises(data.exercises);
                setTotal(data.total);
                setTotalPages(data.totalPages);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load exercises");
            } finally {
                setIsLoading(false);
                setHasLoadedOnce(true);
            }
        }

        loadExercises();
    }, [isAuthenticated, page, limit, debouncedSearchTerm]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearchTerm(searchTerm.trim());
            setPage(1);
        }, 300);

        return () => {
            window.clearTimeout(timeoutId);
        }
    }, [searchTerm, setPage])


    if (isLoading && !hasLoadedOnce) {
        return (
            <Box className={styles.page}>
                <div className={styles.stateCard}>
                    <p className={styles.kicker}>Exercise library</p>
                    <h1 className={styles.title}>Library</h1>
                    <p className={styles.stateText}>Loading exercises...</p>
                </div>
            </Box>
        );
    }

    if (error) {
        return (
            <Box className={styles.page}>
                <div className={styles.stateCard}>
                    <p className={styles.kicker}>Exercise library</p>
                    <h1 className={styles.title}>Library</h1>
                    <p className={styles.errorText}>{error}</p>
                </div>
            </Box>
        );
    }

    return (
        <Box className={styles.page}>
            <div ref={pageTopRef} className={styles.header}>
                <div>
                    <p className={styles.kicker}>Exercise library</p>
                    <h1 className={styles.title}>Library</h1>
                    <p className={styles.subtitle}>
                        Browse exercises by muscle, equipment, type, or difficulty.
                    </p>
                    <p className={styles.subtitle}>Click an exercise for more details.</p>
                </div>

                <div className={styles.countBadge}>
                    {total} exercise{total === 1 ? "" : "s"}
                </div>
            </div>

            <div className={styles.searchWrapper}>
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Search exercises..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {exercises.length > 0 ? (
                <div className={styles.exerciseGrid}>
                    {exercises.map((exercise) => (
                        <Card key={exercise._id} className={styles.exerciseCard} onClick={() => navigate(`/exercises/${exercise._id}`)}>
                            <div className={styles.exerciseCardTop}>
                                <div>
                                    <h2 className={styles.exerciseName}>{exercise.name}</h2>

                                    <div className={styles.exerciseMeta}>
                                        {exercise.exerciseType && (
                                            <span>{exercise.exerciseType}</span>
                                        )}

                                        {exercise.equipment && <span>{exercise.equipment}</span>}

                                        {exercise.difficulty && (
                                            <span>{exercise.difficulty}</span>
                                        )}

                                        {exercise.isCustom && <span>custom</span>}
                                    </div>
                                </div>

                                <div className={styles.cardDummy}>
                                    <MuscleDummy
                                        variant="mini"
                                        primaryMuscles={exercise.primaryMuscles ?? []}
                                        secondaryMuscles={exercise.secondaryMuscles ?? []}
                                    />
                                </div>
                            </div>

                            <div className={styles.muscleInfo}>
                                {exercise.primaryMuscles &&
                                    exercise.primaryMuscles.length > 0 && (
                                        <div>
                                            <p className={styles.muscleLabel}>Primary</p>

                                            <div className={styles.muscleTags}>
                                                {exercise.primaryMuscles.map((muscle) => (
                                                    <span
                                                        key={muscle}
                                                        className={styles.primaryTag}
                                                    >
                                                        {muscle}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                {exercise.secondaryMuscles &&
                                    exercise.secondaryMuscles.length > 0 && (
                                        <div>
                                            <p className={styles.muscleLabel}>Secondary</p>

                                            <div className={styles.muscleTags}>
                                                {exercise.secondaryMuscles.map((muscle) => (
                                                    <span
                                                        key={muscle}
                                                        className={styles.secondaryTag}
                                                    >
                                                        {muscle}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className={styles.stateCard}>
                    <p className={styles.stateText}>No exercises found.</p>
                </div>
            )}

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        type="button"
                        className={styles.pageButton}
                        disabled={page === 1}
                        onClick={() => handlePageChange(page - 1)}
                    >
                        Previous
                    </button>

                    <span className={styles.pageInfo}>
                        Page {page} of {totalPages}
                    </span>

                    <button
                        type="button"
                        className={styles.pageButton}
                        disabled={page === totalPages}
                        onClick={() => handlePageChange(page + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </Box>
    );
}