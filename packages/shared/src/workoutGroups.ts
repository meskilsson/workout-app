/** Ignore incomplete/stale groups rather than hiding any exercise. */
export function workoutGroups<T extends { _id: string; supersetId?: string }>(
  exercises: T[],
): T[][] {
  const counts = new Map<string, number>();
  for (const exercise of exercises)
    if (exercise.supersetId)
      counts.set(
        exercise.supersetId,
        (counts.get(exercise.supersetId) ?? 0) + 1,
      );
  const seen = new Set<string>();
  const result: T[][] = [];
  for (const exercise of exercises) {
    if (seen.has(exercise._id)) continue;
    const group =
      exercise.supersetId && counts.get(exercise.supersetId) === 2
        ? exercises.filter((item) => item.supersetId === exercise.supersetId)
        : [exercise];
    group.forEach((item) => seen.add(item._id));
    result.push(group);
  }
  return result;
}
export function supersetPairs<T extends { _id: string; supersetId?: string }>(
  exercises: T[],
): [string, string][] {
  return workoutGroups(exercises)
    .filter((group) => group.length === 2)
    .map((group) => [group[0]._id, group[1]._id]);
}

export function restAfterSupersetSet(
  exercises: { _id: string; supersetId?: string }[],
  sets: Record<
    string,
    { id: string; isWarmup?: boolean; isCompleted: boolean }[]
  >,
  exerciseId: string,
  index: number,
  justCompleted: ReadonlySet<string> = new Set(),
): boolean {
  const current = sets[exerciseId]?.[index];
  if (!current || current.isWarmup) return true;
  const group = workoutGroups(exercises).find((items) =>
    items.some((item) => item._id === exerciseId),
  );
  if (!group || group.length !== 2) return true;
  const round =
    (sets[exerciseId] ?? []).slice(0, index + 1).filter((set) => !set.isWarmup)
      .length - 1;
  const partner = group.find((item) => item._id !== exerciseId)!;
  const partnerSet = (sets[partner._id] ?? []).filter((set) => !set.isWarmup)[
    round
  ];
  return (
    !partnerSet || partnerSet.isCompleted || justCompleted.has(partnerSet.id)
  );
}
