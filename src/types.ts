export interface ExerciseItem {
  id: string;
  name: string;
  isSuperset?: boolean;
}

export interface WorkoutSetGroup {
  id: string;
  exercises: ExerciseItem[];
}

export interface ExerciseBoxItem {
  exercise: ExerciseItem;
  originalIndex: number;
}

export interface ExerciseBox {
  id: string;
  items: ExerciseBoxItem[];
  isSupersetBox: boolean;
}

// Helper to group consecutive exercises where isSuperset === true into the same box
export function getExerciseBoxes(exercises: ExerciseItem[]): ExerciseBox[] {
  const boxes: ExerciseBox[] = [];
  let currentBox: ExerciseBox | null = null;

  exercises.forEach((exercise, idx) => {
    if (exercise.isSuperset && currentBox) {
      // Put in the same box
      currentBox.items.push({ exercise, originalIndex: idx });
      currentBox.isSupersetBox = true;
    } else {
      // Create a new box
      currentBox = {
        id: exercise.id,
        items: [{ exercise, originalIndex: idx }],
        isSupersetBox: false,
      };
      boxes.push(currentBox);
    }
  });

  return boxes;
}
