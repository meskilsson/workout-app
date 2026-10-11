import useExerciseName from "../../hooks/useExerciseName";

export default function ExerciseName({ id, name }: { id?: string | null; name: string }) {
    return useExerciseName(id, name);
}
