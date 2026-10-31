import { WorkoutSetGroup } from "../types";

const STORAGE_KEY = "workoutwork_saved_routine";

export const DEFAULT_ROUTINE: WorkoutSetGroup[] = [
  {
    id: "set-1",
    exercises: [
      { id: "ex-1-1", name: "Barbell Bench Press" },
    ],
  },
  {
    id: "set-2",
    exercises: [
      { id: "ex-2-1", name: "Incline Dumbbell Press" },
      { id: "ex-2-2", name: "Dumbbell Flyes" }, // Superset
    ],
  },
  {
    id: "set-3",
    exercises: [
      { id: "ex-3-1", name: "Overhead Tricep Extension" },
      { id: "ex-3-2", name: "Dips" }, // Superset
    ],
  },
  {
    id: "set-4",
    exercises: [
      { id: "ex-4-1", name: "Hanging Leg Raises" },
    ],
  },
];

export function loadSavedWorkout(): WorkoutSetGroup[] {
  if (typeof window === "undefined") return DEFAULT_ROUTINE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ROUTINE;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_ROUTINE;
  } catch {
    return DEFAULT_ROUTINE;
  }
}

export function saveWorkoutToStorage(routine: WorkoutSetGroup[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routine));
  } catch {
    // Storage quota exceeded or disabled
  }
}
