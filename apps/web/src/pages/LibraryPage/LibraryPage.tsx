import { exerciseText } from "../../i18n/exercises";
import ExerciseSortControl from "../../components/exercises/ExerciseSortControl";
import { translateMessage, displayValue, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import { friendlyError } from "../../utils/formValidation";
import { motion } from "motion/react";
import { useMotionTransition } from "../../components/motion/useMotionTransition";
import { useFieldMotion } from "../../components/motion/useFieldMotion";
import { searchRest, searchFocus, pageButtonRest, pageButtonHover } from "../../components/motion/presets";
import { ArrowLeft, Plus } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useEffect, useState } from "react";


import { useAuth } from "../../context/AuthContext";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { exerciseListOptions } from "../../query/resourceQueries";

import Box from "../../components/ui/box/Box";

import MuscleDummy from "../../components/muscleDummy/MuscleDummy";
import type { ExerciseFilters, ExerciseSort } from "@workout-app/shared";
import { usePaginationScroll } from "../../hooks/usePaginationScroll";
import Button from "../../components/ui/button/Button";
import { useNavigate } from "../../routes/navigationHooks";
import { LoadingAnnouncement } from "../../components/Loading/Skeleton";
import LoadingState from "../../components/Loading/LoadingState";

import styles from "./LibraryPage.module.css";

import { Link } from "../../routes/navigation";



export default function LibraryPage() {
    useTranslation();
    const transition = useMotionTransition();
    const fieldMotion = useFieldMotion();
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();


    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState<ExerciseFilters>({});
    const [sort, setSort] = useState<ExerciseSort>("popular");
    const effectiveSort = sort === "mostUsed" && !isAuthenticated ? "popular" : sort;
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");


    const limit = 12;
    const [page, setPage] = useState(1);
    const exercisesQuery = useQuery({
        ...exerciseListOptions(user?._id, { ...filters, includeCardio: false, sort: effectiveSort, page, limit, search: debouncedSearchTerm }),
        placeholderData: (previous, previousQuery) =>
            previousQuery?.queryKey[1] === (user?._id ?? "public") ? keepPreviousData(previous) : undefined,
    });
    const exercises = exercisesQuery.data?.exercises ?? [];
    const total = exercisesQuery.data?.total ?? 0;
    const totalPages = exercisesQuery.data?.totalPages ?? 1;
    const error = (exercisesQuery.error ? friendlyError(exercisesQuery.error, t("common.unableToLoadThisContentPleaseTryAgain")) : "");
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
                title={t("common.exerciseLibrary")}
                message={t("LibraryPage.loadingExercises")}
            />
        );
    }

    if (error && exercises.length === 0) {
        return (
            <Box className={styles.page}>
                <div className={styles.stateCard}>
                    <h1 className={styles.title}>{t("common.exerciseLibrary")}</h1>
                    <p className={styles.errorText} role="alert">{translateMessage(error)}</p>
                </div>
            </Box>
        );
    }

    return (
        <Box className={styles.page}>
            <div ref={pageTopRef} className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t("common.exerciseLibrary")}</h1>
                    <p className={styles.subtitle}> {t("LibraryPage.findExercisesForYourNextSession")} </p>

                </div>

                <div className={styles.libraryActions}>
                    {isAuthenticated && <Button variant="secondary" icon={Plus} onClick={() => navigate("/create-exercise")}>{t("common.createExercise")}</Button>}
                    <div className={styles.countBadge}>
                    {t("common.exerciseCount", { count: total })}
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
                    aria-label={t("common.goBack")}
                    onClick={() => navigate(-1)}

                >
                    <Icon icon={ArrowLeft} />
                </Button>
                <div className={styles.searchControls}>
                <label className={styles.searchLabel}> {t("common.searchExercises")} <motion.input {...fieldMotion("search", { ...searchRest, backgroundColor: "var(--exercise-search-background)" }, { ...searchFocus, backgroundColor: "var(--exercise-search-background)" })}
                    className={styles.searchInput}
                    aria-label={t("common.searchExercises")}
                    type="search"
                    placeholder={t("LibraryPage.searchExercises")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                </label>
                <ExerciseSortControl filters={filters} onFiltersChange={value => { setFilters(value); setPage(1); }} value={effectiveSort} authenticated={isAuthenticated}
                    onChange={value => { setSort(value); setPage(1); }} />
                </div>
                {effectiveSort !== "name" && (
                    <p className={styles.sortHint}>
                        {effectiveSort === "mostUsed"
                            ? t("LibraryPage.rankedByYourCompletedWorkoutsHighestToLowest")
                            : t("LibraryPage.rankedByCompletedWorkoutsAcrossAllUsersHighestTo")}
                    </p>
                )}
            </div>

            {isLoading && hasLoadedOnce && (
                <LoadingAnnouncement message={t("common.updatingExercises")} />
            )}

            {error && <p className={styles.errorText} role="alert">{translateMessage(error)}</p>}

            {exercises.length > 0 ? (
                <div className={styles.exerciseGrid} aria-busy={isLoading}>
                    {exercises.map((exercise) => (
                        <article key={exercise._id} className={styles.exerciseCard}>

                            <Link to={`/exercises/${exercise._id}`} className={styles.exerciseLink}>
                                <div className={styles.exerciseText}>
                                    <h2 className={styles.exerciseName}>{exerciseText(exercise)}</h2>

                                    <p className={styles.exerciseMetaText}>
                                        {displayValue(exercise.exerciseType)} · {displayValue(exercise.equipment)} · {displayValue(exercise.difficulty)}
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
                    <p className={styles.stateText}>{t("LibraryPage.noExercisesFound")}</p>
                </div>
            )}

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <motion.button initial={false} transition={transition}
                        animate={{ ...pageButtonRest, opacity: (page === 1) ? 0.45 : 1 }}
                        whileHover={(page === 1) ? undefined : pageButtonHover}
                        type="button"
                        className={styles.pageButton}
                        disabled={page === 1}
                        onClick={() => handlePageChange(page - 1)}
                    > {t("common.previous")} </motion.button>

                    <span className={styles.pageInfo}> {t("common.page")} {page} {t("common.of")} {totalPages}
                    </span>

                    <motion.button initial={false} transition={transition}
                        animate={{ ...pageButtonRest, opacity: (page === totalPages) ? 0.45 : 1 }}
                        whileHover={(page === totalPages) ? undefined : pageButtonHover}
                        type="button"
                        className={styles.pageButton}
                        disabled={page === totalPages}
                        onClick={() => handlePageChange(page + 1)}
                    > {t("common.next")} </motion.button>
                </div>
            )}
        </Box>
    );
}
