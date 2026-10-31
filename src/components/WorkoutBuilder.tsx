"use client";

import React, { useState } from "react";
import { WorkoutSetGroup } from "../types";
import {
  Plus,
  Trash2,
  Dumbbell,
  Play,
  Sparkles,
  Flame,
} from "lucide-react";
import ExerciseAutocomplete from "./ExerciseAutocomplete";

interface WorkoutBuilderProps {
  workoutList: WorkoutSetGroup[];
  onUpdateWorkoutList: (newList: WorkoutSetGroup[]) => void;
  onStartWorkout: () => void;
}

const TEMPLATES: { name: string; icon: string; routine: WorkoutSetGroup[] }[] = [
  {
    name: "Push Day",
    icon: "🔥",
    routine: [
      {
        id: "p1",
        exercises: [{ id: "p1-1", name: "Barbell Bench Press" }],
      },
      {
        id: "p2",
        exercises: [
          { id: "p2-1", name: "Incline Dumbbell Press" },
          { id: "p2-2", name: "Dumbbell Chest Flyes" },
        ],
      },
      {
        id: "p3",
        exercises: [
          { id: "p3-1", name: "Overhead Barbell Press" },
          { id: "p3-2", name: "Dumbbell Lateral Raises" },
        ],
      },
      {
        id: "p4",
        exercises: [
          { id: "p4-1", name: "Tricep Rope Pushdowns" },
          { id: "p4-2", name: "Overhead Dumbbell Tricep Extension" },
        ],
      },
    ],
  },
  {
    name: "Pull Day",
    icon: "⚡",
    routine: [
      {
        id: "pl1",
        exercises: [{ id: "pl1-1", name: "Pull-ups" }],
      },
      {
        id: "pl2",
        exercises: [
          { id: "pl2-1", name: "Barbell Bent-Over Row" },
          { id: "pl2-2", name: "Face Pulls" },
        ],
      },
      {
        id: "pl3",
        exercises: [
          { id: "pl3-1", name: "Barbell Bicep Curls" },
          { id: "pl3-2", name: "Hammer Curls" },
        ],
      },
    ],
  },
  {
    name: "Leg Day",
    icon: "🦵",
    routine: [
      {
        id: "l1",
        exercises: [{ id: "l1-1", name: "Barbell Back Squats" }],
      },
      {
        id: "l2",
        exercises: [
          { id: "l2-1", name: "Romanian Deadlift (RDL)" },
          { id: "l2-2", name: "Walking Lunges" },
        ],
      },
      {
        id: "l3",
        exercises: [
          { id: "l3-1", name: "Leg Press" },
          { id: "l3-2", name: "Standing Calf Raises" },
        ],
      },
    ],
  },
];

export default function WorkoutBuilder({
  workoutList,
  onUpdateWorkoutList,
  onStartWorkout,
}: WorkoutBuilderProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleAddNewSet = (initialExerciseName: string = "") => {
    const newGroup: WorkoutSetGroup = {
      id: "set-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      exercises: [{ id: "ex-" + Date.now(), name: initialExerciseName }],
    };
    onUpdateWorkoutList([...workoutList, newGroup]);
  };

  const handleDeleteSet = (groupId: string) => {
    onUpdateWorkoutList(workoutList.filter((g) => g.id !== groupId));
  };

  const handleAddSuperset = (groupId: string, exerciseName: string = "") => {
    const updated = workoutList.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          exercises: [
            ...g.exercises,
            { id: "ex-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6), name: exerciseName },
          ],
        };
      }
      return g;
    });
    onUpdateWorkoutList(updated);
  };

  const handleDeleteExercise = (groupId: string, exerciseId: string) => {
    const updated = workoutList.map((g) => {
      if (g.id === groupId) {
        const remaining = g.exercises.filter((ex) => ex.id !== exerciseId);
        return {
          ...g,
          exercises: remaining.length > 0 ? remaining : [{ id: "ex-" + Date.now(), name: "" }],
        };
      }
      return g;
    });
    onUpdateWorkoutList(updated);
  };

  const handleExerciseNameChange = (groupId: string, exerciseId: string, newName: string) => {
    const updated = workoutList.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          exercises: g.exercises.map((ex) => (ex.id === exerciseId ? { ...ex, name: newName } : ex)),
        };
      }
      return g;
    });
    onUpdateWorkoutList(updated);
  };

  const handleApplyTemplate = (templateName: string) => {
    const found = TEMPLATES.find((t) => t.name === templateName);
    if (found) {
      const cloned: WorkoutSetGroup[] = found.routine.map((set, sIdx) => ({
        id: `set-${Date.now()}-${sIdx}`,
        exercises: set.exercises.map((ex, eIdx) => ({
          id: `ex-${Date.now()}-${sIdx}-${eIdx}`,
          name: ex.name,
        })),
      }));
      onUpdateWorkoutList(cloned);
      setSelectedTemplate(templateName);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 px-4 py-3.5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Dumbbell className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white">Workoutwork</h1>
              <p className="text-xs text-slate-400">Build Routine &amp; Timer</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {workoutList.length} {workoutList.length === 1 ? "Set" : "Sets"}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-5 pb-36 space-y-5">
        {/* Quick Presets / Templates */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Templates
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => handleApplyTemplate(tmpl.name)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  selectedTemplate === tmpl.name
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-300"
                    : "bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-300"
                }`}
              >
                <span className="text-base mb-1">{tmpl.icon}</span>
                <span>{tmpl.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Set Cards List */}
        <section className="space-y-4">
          {workoutList.length === 0 ? (
            <div className="text-center py-14 px-4 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
              <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-300 text-base">No routine yet</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                Tap &ldquo;+ Add New Set&rdquo; below or select a quick template above to get started.
              </p>
            </div>
          ) : (
            workoutList.map((group, index) => {
              const isSuperset = group.exercises.length > 1;

              return (
                <div
                  key={group.id}
                  className={`rounded-2xl border transition-all p-4 ${
                    isSuperset
                      ? "bg-gradient-to-b from-amber-950/20 to-slate-900/80 border-amber-500/30 shadow-lg shadow-amber-950/10"
                      : "bg-slate-900/80 border-slate-800 shadow-md"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm tracking-tight text-white">
                        Set #{index + 1}
                      </span>
                      {isSuperset && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Flame className="w-3 h-3 text-amber-400 fill-amber-400" /> Superset 🔥
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSet(group.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Set"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Exercises List inside Set with Direct Live Search Autocomplete */}
                  <div className="mt-3 space-y-2.5">
                    {group.exercises.map((exercise, exIndex) => (
                      <div key={exercise.id} className="relative flex items-center gap-2">
                        {/* Interactive Autocomplete Search Box */}
                        <ExerciseAutocomplete
                          value={exercise.name}
                          onChange={(newName) =>
                            handleExerciseNameChange(group.id, exercise.id, newName)
                          }
                          isSuperset={isSuperset}
                          exerciseIndex={exIndex}
                        />

                        {isSuperset && (
                          <button
                            type="button"
                            onClick={() => handleDeleteExercise(group.id, exercise.id)}
                            className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors flex-shrink-0"
                            title="Remove exercise from superset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Superset Exercise Button */}
                  <div className="mt-3.5 pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleAddSuperset(group.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 rounded-xl transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Exercise (Superset)
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
        <div className="max-w-xl mx-auto space-y-2.5">
          <button
            type="button"
            onClick={() => handleAddNewSet()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Add New Set
          </button>

          {workoutList.length > 0 && (
            <button
              type="button"
              onClick={onStartWorkout}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.99]"
            >
              <Play className="w-4 h-4 fill-slate-950" /> Start Workout ⏱️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
