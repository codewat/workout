"use client";

import React, { useState, useEffect } from "react";
import { WorkoutSetGroup, getExerciseBoxes } from "../types";
import { Plus, Trash2, Flame, X, Check } from "lucide-react";
import ExerciseAutocomplete from "./ExerciseAutocomplete";

interface SetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  setIndex: number; // 0-based index
  initialGroup: WorkoutSetGroup | null; // null if creating a new set
  onSaveSet: (group: WorkoutSetGroup) => void;
  onDeleteSet?: () => void; // only available when editing
}

export default function SetEditorModal({
  isOpen,
  onClose,
  setIndex,
  initialGroup,
  onSaveSet,
  onDeleteSet,
}: SetEditorModalProps) {
  // Local state for the set being edited or created
  const [currentGroup, setCurrentGroup] = useState<WorkoutSetGroup>({
    id: "set-" + Date.now(),
    exercises: [{ id: "ex-" + Date.now(), name: "", isSuperset: false }],
  });

  // Delete confirmation pop-up state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowDeleteConfirm(false);
      if (initialGroup) {
        // Deep clone initialGroup
        setCurrentGroup({
          id: initialGroup.id,
          exercises: initialGroup.exercises.map((ex) => ({ ...ex })),
        });
      } else {
        // Brand new set with 1 empty exercise
        setCurrentGroup({
          id: "set-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
          exercises: [{ id: "ex-" + Date.now(), name: "", isSuperset: false }],
        });
      }
    }
  }, [isOpen, initialGroup]);

  if (!isOpen) return null;

  const isEditing = Boolean(initialGroup);

  // Regular "+ Add Exercise" -> adds an exercise in a separate box
  const handleAddExercise = () => {
    setCurrentGroup((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          id: "ex-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          name: "",
          isSuperset: false,
        },
      ],
    }));
  };

  // "Add Superset" button on a workout row -> puts the superset workout in the SAME BOX
  const handleAddSuperset = (targetExerciseIndex: number) => {
    setCurrentGroup((prev) => {
      const newExercises = [...prev.exercises];
      newExercises.splice(targetExerciseIndex + 1, 0, {
        id: "ex-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        name: "",
        isSuperset: true, // Marked as Superset to stay in the same box
      });
      return {
        ...prev,
        exercises: newExercises,
      };
    });
  };

  const handleDeleteExercise = (exerciseId: string) => {
    setCurrentGroup((prev) => {
      const remaining = prev.exercises.filter((ex) => ex.id !== exerciseId);
      if (remaining.length === 0) {
        return {
          ...prev,
          exercises: [{ id: "ex-" + Date.now(), name: "", isSuperset: false }],
        };
      }
      // Ensure the very first exercise isn't marked as superset
      if (remaining[0].isSuperset) {
        remaining[0] = { ...remaining[0], isSuperset: false };
      }
      return {
        ...prev,
        exercises: remaining,
      };
    });
  };

  const handleExerciseNameChange = (exerciseId: string, newName: string) => {
    setCurrentGroup((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, name: newName } : ex
      ),
    }));
  };

  const handleSave = () => {
    onSaveSet(currentGroup);
    onClose();
  };

  const boxes = getExerciseBoxes(currentGroup.exercises);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <h3 className="font-bold text-base text-white">
              {isEditing ? `Edit Set #${setIndex + 1}` : `Create Set #${setIndex + 1}`}
            </h3>
            <p className="text-xs text-slate-400">
              {isEditing ? "Modify or delete workouts in this set" : "Add workouts for this set"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Exercise Boxes List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-3">
            {boxes.map((box) => (
              <div
                key={box.id}
                className={`rounded-2xl transition-all ${
                  box.isSupersetBox
                    ? "border-2 border-amber-500/40 bg-amber-950/15 p-3 space-y-2.5 shadow-md shadow-amber-950/20"
                    : "border border-slate-800/90 bg-slate-950/50 p-2.5"
                }`}
              >
                {/* Header for Superset Box */}
                {box.isSupersetBox && (
                  <div className="flex items-center justify-between pb-1 px-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      <Flame className="w-3 h-3 fill-amber-400" /> Superset
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Perform back-to-back
                    </span>
                  </div>
                )}

                {box.items.map(({ exercise, originalIndex }) => (
                  <div key={exercise.id} className="relative flex items-center gap-2">
                    {/* Autocomplete Input with Search */}
                    <ExerciseAutocomplete
                      value={exercise.name}
                      onChange={(newName) =>
                        handleExerciseNameChange(exercise.id, newName)
                      }
                      exerciseIndex={originalIndex}
                    />

                    {/* Add Superset button (adds directly into this SAME BOX) */}
                    <button
                      type="button"
                      onClick={() => handleAddSuperset(originalIndex)}
                      className="p-2.5 sm:px-3 sm:py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 transition-all"
                      title="Add superset inside this same box"
                    >
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      <span className="hidden sm:inline">Add Superset</span>
                    </button>

                    {/* Delete button if set has multiple exercises */}
                    {currentGroup.exercises.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteExercise(exercise.id)}
                        className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors flex-shrink-0"
                        title="Delete this workout"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* "+ Add Exercise" Button */}
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={handleAddExercise}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-800 border border-slate-700/70 px-3.5 py-1.5 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add Exercise
            </button>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/90 flex items-center justify-between gap-3">
          {/* Delete Set Button (only if editing existing set) */}
          {isEditing && onDeleteSet ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="py-2.5 px-3.5 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Delete Set
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> {isEditing ? "Save Changes" : "Save Set"}
            </button>
          </div>
        </div>

        {/* Nested Delete Set Confirmation Pop-up */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-100">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">Delete Set #{setIndex + 1}</h4>
                  <p className="text-xs text-slate-400">Are you sure you want to delete this?</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                This will delete Set #{setIndex + 1} and all workouts inside it. This action cannot be undone.
              </p>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDeleteSet?.();
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
