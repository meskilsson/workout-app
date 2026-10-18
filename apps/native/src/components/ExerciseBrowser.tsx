import { useEffect, useState } from "react";
import {
  MUSCLE_OPTIONS,
  EQUIPMENT_OPTIONS,
  DIFFICULTY_OPTIONS,
  EXERCISE_TYPE_OPTIONS,
  type Exercise,
  type PaginatedExercisesResponse,
} from "@workout-app/shared";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/apiClient";
import { Action, Card, Field, Row, Txt, Busy } from "./ui";
import { exerciseName } from "../i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ExerciseBrowser({
  onChoose,
  selected = [],
  publicOnly = false,
  personalOnly = false,
  initialMuscles = [],
  includeCardio = false,
  scope = "library",
}: {
  scope?: string;
  initialMuscles?: string[];
  includeCardio?: boolean;
  onChoose: (exercise: Exercise) => void;
  selected?: string[];
  publicOnly?: boolean;
  personalOnly?: boolean;
}) {
  const { token, user } = useAuth();
  const [hydrated, setHydrated] = useState(false),
    [cardio, setCardio] = useState(includeCardio);
  const storageKey = `browse:${publicOnly ? "public" : user?._id}:${scope}`;
  const [search, setSearch] = useState(""),
    [muscles, setMuscles] = useState<string[]>(initialMuscles),
    [equipment, setEquipment] = useState(""),
    [difficulty, setDifficulty] = useState(""),
    [exerciseType, setType] = useState(""),
    [sort, setSort] = useState("name"),
    [page, setPage] = useState(1),
    [filters, setFilters] = useState(false);
  const [data, setData] = useState<PaginatedExercisesResponse | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setHydrated(false);
    void AsyncStorage.getItem(storageKey)
      .then((value) => {
        if (!alive || !value) return;
        const saved = JSON.parse(value);
        if (typeof saved.search === "string") setSearch(saved.search);
        if (Array.isArray(saved.muscles))
          setMuscles(
            saved.muscles.filter((m: string) =>
              MUSCLE_OPTIONS.includes(m as never),
            ),
          );
        if (EQUIPMENT_OPTIONS.includes(saved.equipment))
          setEquipment(saved.equipment);
        if (DIFFICULTY_OPTIONS.includes(saved.difficulty))
          setDifficulty(saved.difficulty);
        if (EXERCISE_TYPE_OPTIONS.includes(saved.exerciseType))
          setType(saved.exerciseType);
        if (
          ["name", "popular", ...(publicOnly ? [] : ["mostUsed"])].includes(
            saved.sort,
          )
        )
          setSort(saved.sort);
        if (Number.isInteger(saved.page) && saved.page > 0) setPage(saved.page);
        if (typeof saved.cardio === "boolean") setCardio(saved.cardio);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setHydrated(true);
      });
    return () => {
      alive = false;
    };
  }, [storageKey]);
  useEffect(() => {
    if (hydrated)
      void AsyncStorage.setItem(
        storageKey,
        JSON.stringify({
          search,
          muscles,
          equipment,
          difficulty,
          exerciseType,
          sort,
          page,
          cardio,
        }),
      ).catch(() => {});
  }, [
    hydrated,
    storageKey,
    search,
    muscles,
    equipment,
    difficulty,
    exerciseType,
    sort,
    page,
    cardio,
  ]);
  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      const query = new URLSearchParams({
        page: String(page),
        limit: personalOnly ? "100" : "20",
        search,
        sort,
        ...(cardio ? { includeCardio: "true" } : {}),
        ...(muscles.length ? { muscles: muscles.join(",") } : {}),
        ...(equipment ? { equipment } : {}),
        ...(difficulty ? { difficulty } : {}),
        ...(exerciseType ? { exerciseType } : {}),
      });
      void apiFetch<PaginatedExercisesResponse>(
        `/api/exercises${publicOnly ? "" : "/library"}?${query}`,
        { token: publicOnly ? undefined : token, signal: controller.signal },
      )
        .then((value) => {
          if (!controller.signal.aborted) setData(value);
        })
        .catch((e) => {
          if (!controller.signal.aborted) setError(e.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    token,
    search,
    muscles,
    equipment,
    difficulty,
    exerciseType,
    sort,
    page,
    publicOnly,
    personalOnly,
    retry,
    hydrated,
    cardio,
  ]);
  if (!hydrated) return <Busy />;
  const exercises = (data?.exercises ?? []).filter(
    (exercise) => !personalOnly || exercise.isCustom,
  );
  function choices(
    title: string,
    options: readonly string[],
    value: string,
    setter: (value: string) => void,
  ) {
    return (
      <>
        <Txt>{title}</Txt>
        <Row>
          {["", ...options].map((option) => (
            <Action
              key={option}
              selected={value === option}
              onPress={() => {
                setter(option);
                setPage(1);
              }}
            >
              {option || "All"}
            </Action>
          ))}
        </Row>
      </>
    );
  }
  return (
    <>
      <Field
        title="Search exercises"
        value={search}
        onChangeText={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />
      <Action onPress={() => setFilters(!filters)}>Filters</Action>
      {filters && (
        <Card>
          {choices(
            "Training type",
            EXERCISE_TYPE_OPTIONS,
            exerciseType,
            setType,
          )}
          {choices("Equipment", EQUIPMENT_OPTIONS, equipment, setEquipment)}
          {choices("Difficulty", DIFFICULTY_OPTIONS, difficulty, setDifficulty)}
          {choices(
            "Sort",
            publicOnly ? ["name", "popular"] : ["name", "popular", "mostUsed"],
            sort,
            setSort,
          )}
          <Txt>Muscles</Txt>
          <Row>
            {MUSCLE_OPTIONS.map((muscle) => (
              <Action
                key={muscle}
                selected={muscles.includes(muscle)}
                onPress={() => {
                  setMuscles((previous) =>
                    previous.includes(muscle)
                      ? previous.filter((m) => m !== muscle)
                      : [...previous, muscle],
                  );
                  setPage(1);
                }}
              >
                {muscle}
              </Action>
            ))}
          </Row>
        </Card>
      )}
      {loading && <Busy />}
      {error ? (
        <>
          <Txt error>{error}</Txt>
          <Action onPress={() => setRetry(retry + 1)}>Try again</Action>
        </>
      ) : !loading && exercises.length === 0 ? (
        <Txt>No exercises found</Txt>
      ) : null}
      {exercises.map((exercise) => (
        <Card key={exercise._id}>
          <Action
            literal
            selected={selected.includes(exercise._id)}
            onPress={() => onChoose(exercise)}
          >
            {exerciseName(exercise)}
          </Action>
          <Txt>
            {[
              ...(exercise.primaryMuscles ?? []),
              exercise.equipment,
              exercise.difficulty,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Txt>
        </Card>
      ))}
      <Row>
        <Action
          disabled={loading || page <= 1}
          onPress={() => setPage(page - 1)}
        >
          Previous
        </Action>
        <Txt>{`${page} / ${data?.totalPages ?? 1}`}</Txt>
        <Action
          disabled={loading || !data?.hasNextPage}
          onPress={() => setPage(page + 1)}
        >
          Next
        </Action>
      </Row>
    </>
  );
}
