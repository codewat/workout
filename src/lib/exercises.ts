export interface ExerciseDefinition {
  id: string;
  name: string;
  category: "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Core" | "Cardio";
  equipment: "Barbell" | "Dumbbell" | "Cable" | "Machine" | "Bodyweight";
}

export const EXERCISE_DATABASE: ExerciseDefinition[] = [
  // CHEST
  { id: "ch-1", name: "Barbell Bench Press", category: "Chest", equipment: "Barbell" },
  { id: "ch-2", name: "Incline Dumbbell Press", category: "Chest", equipment: "Dumbbell" },
  { id: "ch-3", name: "Dumbbell Chest Flyes", category: "Chest", equipment: "Dumbbell" },
  { id: "ch-4", name: "Cable Crossover", category: "Chest", equipment: "Cable" },
  { id: "ch-5", name: "Push-ups", category: "Chest", equipment: "Bodyweight" },
  { id: "ch-6", name: "Chest Dips", category: "Chest", equipment: "Bodyweight" },
  { id: "ch-7", name: "Decline Bench Press", category: "Chest", equipment: "Barbell" },
  { id: "ch-8", name: "Pec Deck Machine", category: "Chest", equipment: "Machine" },

  // BACK
  { id: "bk-1", name: "Pull-ups", category: "Back", equipment: "Bodyweight" },
  { id: "bk-2", name: "Lat Pulldown", category: "Back", equipment: "Cable" },
  { id: "bk-3", name: "Barbell Bent-Over Row", category: "Back", equipment: "Barbell" },
  { id: "bk-4", name: "Seated Cable Row", category: "Back", equipment: "Cable" },
  { id: "bk-5", name: "Single-Arm Dumbbell Row", category: "Back", equipment: "Dumbbell" },
  { id: "bk-6", name: "Conventional Deadlift", category: "Back", equipment: "Barbell" },
  { id: "bk-7", name: "Face Pulls", category: "Back", equipment: "Cable" },
  { id: "bk-8", name: "T-Bar Row", category: "Back", equipment: "Machine" },

  // SHOULDERS
  { id: "sh-1", name: "Overhead Barbell Press", category: "Shoulders", equipment: "Barbell" },
  { id: "sh-2", name: "Seated Dumbbell Shoulder Press", category: "Shoulders", equipment: "Dumbbell" },
  { id: "sh-3", name: "Dumbbell Lateral Raises", category: "Shoulders", equipment: "Dumbbell" },
  { id: "sh-4", name: "Cable Lateral Raises", category: "Shoulders", equipment: "Cable" },
  { id: "sh-5", name: "Front Dumbbell Raises", category: "Shoulders", equipment: "Dumbbell" },
  { id: "sh-6", name: "Reverse Pec Deck (Rear Delt Flyes)", category: "Shoulders", equipment: "Machine" },
  { id: "sh-7", name: "Arnold Press", category: "Shoulders", equipment: "Dumbbell" },
  { id: "sh-8", name: "Barbell Shrugs", category: "Shoulders", equipment: "Barbell" },

  // LEGS
  { id: "lg-1", name: "Barbell Back Squats", category: "Legs", equipment: "Barbell" },
  { id: "lg-2", name: "Front Squats", category: "Legs", equipment: "Barbell" },
  { id: "lg-3", name: "Romanian Deadlift (RDL)", category: "Legs", equipment: "Barbell" },
  { id: "lg-4", name: "Leg Press", category: "Legs", equipment: "Machine" },
  { id: "lg-5", name: "Walking Lunges", category: "Legs", equipment: "Dumbbell" },
  { id: "lg-6", name: "Bulgarian Split Squats", category: "Legs", equipment: "Dumbbell" },
  { id: "lg-7", name: "Leg Extensions", category: "Legs", equipment: "Machine" },
  { id: "lg-8", name: "Hamstring Leg Curls", category: "Legs", equipment: "Machine" },
  { id: "lg-9", name: "Standing Calf Raises", category: "Legs", equipment: "Machine" },
  { id: "lg-10", name: "Hip Thrusts", category: "Legs", equipment: "Barbell" },

  // ARMS
  { id: "ar-1", name: "Barbell Bicep Curls", category: "Arms", equipment: "Barbell" },
  { id: "ar-2", name: "Dumbbell Incline Curls", category: "Arms", equipment: "Dumbbell" },
  { id: "ar-3", name: "Hammer Curls", category: "Arms", equipment: "Dumbbell" },
  { id: "ar-4", name: "Preacher Curls", category: "Arms", equipment: "Machine" },
  { id: "ar-5", name: "Tricep Rope Pushdowns", category: "Arms", equipment: "Cable" },
  { id: "ar-6", name: "Skull Crushers (Lying Tricep Ext)", category: "Arms", equipment: "Barbell" },
  { id: "ar-7", name: "Overhead Dumbbell Tricep Extension", category: "Arms", equipment: "Dumbbell" },
  { id: "ar-8", name: "Tricep Dips", category: "Arms", equipment: "Bodyweight" },

  // CORE
  { id: "cr-1", name: "Hanging Leg Raises", category: "Core", equipment: "Bodyweight" },
  { id: "cr-2", name: "Cable Woodchoppers", category: "Core", equipment: "Cable" },
  { id: "cr-3", name: "Plank Hold", category: "Core", equipment: "Bodyweight" },
  { id: "cr-4", name: "Ab Wheel Rollouts", category: "Core", equipment: "Bodyweight" },
  { id: "cr-5", name: "Russian Twists", category: "Core", equipment: "Bodyweight" },
  { id: "cr-6", name: "Decline Sit-ups", category: "Core", equipment: "Bodyweight" },

  // CARDIO
  { id: "cd-1", name: "Treadmill Incline Walk / Run", category: "Cardio", equipment: "Machine" },
  { id: "cd-2", name: "Jump Rope (Skipping)", category: "Cardio", equipment: "Bodyweight" },
  { id: "cd-3", name: "Stationary Bike / Cycling", category: "Cardio", equipment: "Machine" },
  { id: "cd-4", name: "Rowing Machine", category: "Cardio", equipment: "Machine" },
  { id: "cd-5", name: "Stair Climber", category: "Cardio", equipment: "Machine" },
];

