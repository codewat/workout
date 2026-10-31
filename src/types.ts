export interface ExerciseItem {
  id: string;
  name: string;
}

export interface WorkoutSetGroup {
  id: string;
  exercises: ExerciseItem[];
}
