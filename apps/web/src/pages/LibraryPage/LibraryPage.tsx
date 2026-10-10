import { ArrowLeft, Plus } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useEffect, useState } from "react";


import { useAuth } from "../../context/AuthContext";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { exerciseListOptions } from "../../query/resourceQueries";

import Box from "../../components/ui/box/Box";

import MuscleDummy from "../../components/muscleDummy/MuscleDummy";
import type { ExerciseSort } from "@workout-app/shared";
import { usePaginationScroll } from "../../hooks/usePaginationScroll";
import Button from "../../components/ui/button/Button";
import { useNavigate } from "../../routes/navigationHooks";
import { LoadingAnnouncement } from "../../components/Loading/Skeleton";
import LoadingState from "../../components/Loading/LoadingState";

import styles from "./LibraryPage.module.css";

import { Link } from "../../routes/navigation";



export default function LibraryPage() {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();


    const [searchTerm, setSearchTerm] = useState("");
    const [sort, setSort] = useState<ExerciseSort>("popular");
    const effectiveSort = sort === "mostUsed" && !isAuthenticated ? "popular" : sort;
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");


    const limit = 12;
    const [page, setPage] = useState(1);
    const exercisesQuery = useQuery({
        ...exerciseListOptions(user?._id, { sort: effectiveSort, page, limit, search: debouncedSearchTerm }),
        placeholderData: (previous, previousQuery) =>
            previousQuery?.queryKey[1] === (user?._id ?? "public") ? keepPreviousData(previous) : undefined,
    });
    const exercises = exercisesQuery.data?.exercises ?? [];
    const total = exercisesQuery.data?.total ?? 0;
    const totalPages = exercisesQuery.data?.totalPages ?? 1;
    const error = exercisesQuery.error?.message ?? "";
    const isLoading = exercisesQuery.isFetching;
    const hasLoadedOnce = !exercisesQuery.isPending;
    const { pageTopRef, handlePageChange } = usePaginationScroll<HTMLDivElement>(totalPages, { page, onPageChange: setPage });

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
            <LoadingState
                layout="library"
                className={styles.page}
                title="Exercise library"
                message="Loading exercises..."
            />
        );
    }

    if (error && exercises.length === 0) {
        return (
            <Box className={styles.page}>
                <div className={styles.stateCard}>
                    <p className={styles.kicker}>Exercise library</p>
                    <h1 className={styles.title}>Library</h1>
                    <p className={styles.errorText} role="alert">{error}</p>
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
                        Find exercises for your next session.
                    </p>

                </div>

                <div className={styles.libraryActions}>
                    {isAuthenticated && <Button variant="secondary" icon={Plus} onClick={() => navigate("/create-exercise")}>Create exercise</Button>}
                    <div className={styles.countBadge}>
                    {total} exercise{total === 1 ? "" : "s"}
                    </div>
                </div>
            </div>

            <div className={styles.searchWrapper}>
                <Button
                    type="button"
                    variant="secondary"
                    style={{ minWidth: "3.25rem", marginBottom: "1rem" }}
                    iconOnly
                        className={styles.backButton}
                    aria-label="Go back"
                    onClick={() => navigate(-1)}

                >
                    <Icon icon={ArrowLeft} />
                </Button>
                <div className={styles.searchControls}>
                <label className={styles.searchLabel}>
                    Search exercises
                <input
                    className={styles.searchInput}
                    aria-label="Search exercises"
                    type="search"
                    placeholder="Search exercises..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                </label>
                <label className={styles.sortLabel}>
                    Sort by
                    <select
                        className={styles.sortSelect}
                        value={effectiveSort}
                        onChange={(event) => {
                            setSort(event.target.value as ExerciseSort);
                            setPage(1);
                        }}
                    >
                        <option value="name">Name (A–Z)</option>
                        <option value="popular">Most popular</option>
                        {isAuthenticated && <option value="mostUsed">My most used</option>}
                    </select>
                </label>
                </div>
                {effectiveSort !== "name" && (
                    <p className={styles.sortHint}>
                        {effectiveSort === "mostUsed"
                            ? "Ranked by your completed workouts, highest to lowest."
                            : "Ranked by completed workouts across all users, highest to lowest."}
                    </p>
                )}
            </div>

            {isLoading && hasLoadedOnce && (
                <LoadingAnnouncement message="Updating exercises..." />
            )}

            {error && <p className={styles.errorText} role="alert">{error}</p>}

            {exercises.length > 0 ? (
                <div className={styles.exerciseGrid} aria-busy={isLoading}>
                    {exercises.map((exercise) => (
                        <article key={exercise._id} className={styles.exerciseCard}>

                            <Link to={`/exercises/${exercise._id}`} className={styles.exerciseLink}>
                                <div className={styles.exerciseText}>
                                    <h2 className={styles.exerciseName}>{exercise.name}</h2>

                                    <p className={styles.exerciseMetaText}>
                                        {exercise.exerciseType} · {exercise.equipment} · {exercise.difficulty}
                                    </p>

                                </div>

                                <div className={styles.cardDummy}>
                                    <MuscleDummy
                                        variant="mini"
                                        primaryMuscles={exercise.primaryMuscles ?? []}
                                        secondaryMuscles={exercise.secondaryMuscles ?? []}
                                    />
                                </div>
                            </Link>

                        </article>
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
