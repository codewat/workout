export interface ExerciseItem {
  id: string;
  name: string;
  isSuperset?: boolean;
}

export interface WorkoutSetGroup {
  id: string;
  exercises: ExerciseItem[];
}

