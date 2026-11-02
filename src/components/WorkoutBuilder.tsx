"use client";

import React, { useState } from "react";
import { WorkoutSetGroup } from "../types";
import {
  Plus,
  Trash2,
  Dumbbell,
  Play,
  Flame,
} from "lucide-react";
import ExerciseAutocomplete from "./ExerciseAutocomplete";

interface WorkoutBuilderProps {
  workoutList: WorkoutSetGroup[];
  onUpdateWorkoutList: (newList: WorkoutSetGroup[]) => void;
  onStartWorkout: () => void;
}

interface DeleteTarget {
  isOpen: boolean;
  type: "SET" | "EXERCISE";
  groupId: string;
  exerciseId?: string;
  title: string;
  description: string;
}

export default function WorkoutBuilder({
  workoutList,
  onUpdateWorkoutList,
  onStartWorkout,
}: WorkoutBuilderProps) {
  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Add a brand new Set
  const handleAddNewSet = () => {
    const newGroup: WorkoutSetGroup = {
      id: "set-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      exercises: [{ id: "ex-" + Date.now(), name: "", isSuperset: false }],
    };
    onUpdateWorkoutList([...workoutList, newGroup]);
  };

  const handleDeleteSet = (groupId: string) => {
    onUpdateWorkoutList(workoutList.filter((g) => g.id !== groupId));
  };

  // Regular "+ Add Exercise" -> NOT a superset (walay naka-butang in between)
  const handleAddExercise = (groupId: string) => {
    const updated = workoutList.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          exercises: [
            ...g.exercises,
            {
              id: "ex-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
              name: "",
              isSuperset: false,
            },
          ],
        };
      }
      return g;
    });
    onUpdateWorkoutList(updated);
  };

  // "Add Superset" button on a workout row -> inserts linked superset right after that workout
  const handleAddSuperset = (groupId: string, targetExerciseIndex: number) => {
    const updated = workoutList.map((g) => {
      if (g.id === groupId) {
        const newExercises = [...g.exercises];
        newExercises.splice(targetExerciseIndex + 1, 0, {
          id: "ex-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          name: "",
          isSuperset: true, // Marked as Superset
        });
        return {
          ...g,
          exercises: newExercises,
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
          exercises:
            remaining.length > 0
              ? remaining
              : [{ id: "ex-" + Date.now(), name: "", isSuperset: false }],
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
          exercises: g.exercises.map((ex) =>
            ex.id === exerciseId ? { ...ex, name: newName } : ex
          ),
        };
      }
      return g;
    });
    onUpdateWorkoutList(updated);
  };

  // Perform deletion after confirmation
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "SET") {
      handleDeleteSet(deleteTarget.groupId);
    } else if (deleteTarget.type === "EXERCISE" && deleteTarget.exerciseId) {
      handleDeleteExercise(deleteTarget.groupId, deleteTarget.exerciseId);
    }
    setDeleteTarget(null);
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
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white">
                Workoutwork
              </h1>
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
        {/* Set Cards List */}
        <section className="space-y-4">
          {workoutList.length === 0 ? (
            <div className="text-center py-14 px-4 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
              <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-300 text-base">No routine yet</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                Tap &ldquo;+ Add New Set&rdquo; below to get started.
              </p>
            </div>
          ) : (
            workoutList.map((group, index) => {
              return (
                <div
                  key={group.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md p-4 transition-all"
                >
                  {/* Card Header - Only "Set #X" */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                    <span className="font-bold text-sm tracking-tight text-white">
                      Set #{index + 1}
                    </span>

                    {/* Delete Set Button with Confirmation Trigger */}
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          isOpen: true,
                          type: "SET",
                          groupId: group.id,
                          title: `Delete Set #${index + 1}`,
                          description:
                            "Are you sure you want to delete this set and all its workouts?",
                        })
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Set"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Exercises List inside Set */}
                  <div className="mt-3 space-y-2.5">
                    {group.exercises.map((exercise, exIndex) => {
                      const isSupersetItem = Boolean(exercise.isSuperset);

                      return (
                        <React.Fragment key={exercise.id}>
                          {/* If Add Superset was clicked: Show "Superset" in between */}
                          {/* If + Add Exercise was clicked: NOTHING in between */}
                          {isSupersetItem && (
                            <div className="flex items-center justify-center gap-2 py-1">
                              <div className="h-px flex-1 bg-amber-500/30" />
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 tracking-wider uppercase shadow-sm">
                                <Flame className="w-3 h-3 fill-amber-400" /> Superset
                              </span>
                              <div className="h-px flex-1 bg-amber-500/30" />
                            </div>
                          )}

                          {/* Exercise Row (Distinct look if Superset) */}
                          <div
                            className={`relative flex items-center gap-2 transition-all ${
                              isSupersetItem
                                ? "p-1.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 shadow-inner"
                                : ""
                            }`}
                          >
                            {/* Autocomplete Input with Search */}
                            <ExerciseAutocomplete
                              value={exercise.name}
                              onChange={(newName) =>
                                handleExerciseNameChange(group.id, exercise.id, newName)
                              }
                              exerciseIndex={exIndex}
                            />

                            {/* Add Superset button directly on this workout row */}
                            <button
                              type="button"
                              onClick={() => handleAddSuperset(group.id, exIndex)}
                              className="p-2.5 sm:px-3 sm:py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 transition-all"
                              title="Add superset connected to this workout"
                            >
                              <Flame className="w-3.5 h-3.5 fill-amber-400" />
                              <span className="hidden sm:inline">Add Superset</span>
                            </button>

                            {/* Delete individual exercise if there's more than one */}
                            {group.exercises.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    isOpen: true,
                                    type: "EXERCISE",
                                    groupId: group.id,
                                    exerciseId: exercise.id,
                                    title: "Delete Workout",
                                    description: `Are you sure you want to delete "${
                                      exercise.name.trim() || `Exercise #${exIndex + 1}`
                                    }"?`,
                                  })
                                }
                                className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors flex-shrink-0"
                                title="Delete this workout"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Action Button inside Card: ONLY "+ Add Exercise" */}
                  <div className="mt-4 pt-2 border-t border-slate-800/40 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleAddExercise(group.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-800 border border-slate-700/70 px-3.5 py-1.5 rounded-xl transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add Exercise
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
            onClick={handleAddNewSet}
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

      {/* Pop-up Delete Confirmation Modal */}
      {deleteTarget?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">{deleteTarget.title}</h3>
                <p className="text-xs text-slate-400">Are you sure you want to delete this?</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {deleteTarget.description}
            </p>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
