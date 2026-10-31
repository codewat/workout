"use client";

import React, { useState, useMemo } from "react";
import { Search, X, Dumbbell, Plus } from "lucide-react";
import { EXERCISE_DATABASE, ExerciseDefinition } from "../lib/exercises";

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseName: string) => void;
  currentValue?: string;
}

const CATEGORIES = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio"] as const;

export default function ExercisePickerModal({
  isOpen,
  onClose,
  onSelectExercise,
  currentValue = "",
}: ExercisePickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredExercises = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return EXERCISE_DATABASE.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.equipment.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const handleSelect = (name: string) => {
    onSelectExercise(name);
    onClose();
  };

  const getCategoryColor = (category: ExerciseDefinition["category"]) => {
    switch (category) {
      case "Chest":
        return "bg-rose-500/15 text-rose-300 border-rose-500/30";
      case "Back":
        return "bg-sky-500/15 text-sky-300 border-sky-500/30";
      case "Legs":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      case "Shoulders":
        return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      case "Arms":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "Core":
        return "bg-teal-500/15 text-teal-300 border-teal-500/30";
      case "Cardio":
        return "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full sm:max-w-lg bg-slate-900 border border-slate-800 sm:rounded-3xl rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Exercise Library</h3>
              <p className="text-xs text-slate-400">Search and pick an exercise</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Input */}
        <div className="p-4 pb-2 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercise, muscle, or equipment..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                  selectedCategory === cat
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                    : "bg-slate-950/70 hover:bg-slate-800 text-slate-400 border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-4 pt-1 space-y-1.5 divide-y divide-slate-800/40">
          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => handleSelect(searchQuery.trim())}
              className="w-full mb-2 p-3 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" /> Use custom: &quot;{searchQuery.trim()}&quot;
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                Custom
              </span>
            </button>
          )}

          {filteredExercises.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-500">
              <p className="text-sm">No exercises matched &quot;{searchQuery}&quot;</p>
              <button
                type="button"
                onClick={() => handleSelect(searchQuery)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> Add as custom exercise
              </button>
            </div>
          ) : (
            filteredExercises.map((exercise) => {
              const isCurrent = currentValue.trim().toLowerCase() === exercise.name.toLowerCase();
              return (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => handleSelect(exercise.name)}
                  className={`w-full pt-2 pb-2 px-3 rounded-xl flex items-center justify-between text-left hover:bg-slate-800/60 transition-all ${
                    isCurrent ? "bg-emerald-500/10 border border-emerald-500/30" : ""
                  }`}
                >
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">{exercise.name}</h4>
                    <span className="text-[11px] text-slate-400">{exercise.equipment}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(
                      exercise.category
                    )}`}
                  >
                    {exercise.category}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

