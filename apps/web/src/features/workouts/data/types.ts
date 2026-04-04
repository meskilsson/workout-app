export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
};

export type MuscleGroup = {
  id: string;
  title: string;
  exercises: Exercise[];
};
