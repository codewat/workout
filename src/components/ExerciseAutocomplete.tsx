"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, Check, Dumbbell } from "lucide-react";
import { EXERCISE_DATABASE, ExerciseDefinition } from "../lib/exercises";

interface ExerciseAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isSuperset?: boolean;
  exerciseIndex: number;
}

export default function ExerciseAutocomplete({
  value,
  onChange,
  placeholder,
  isSuperset = false,
  exerciseIndex,
}: ExerciseAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter exercises based on current input text
  const matchingExercises = useMemo(() => {
    const q = value.toLowerCase().trim();
    if (!q) {
      // If empty, show first 8 popular exercises as quick recommendations
      return EXERCISE_DATABASE.slice(0, 8);
    }
    return EXERCISE_DATABASE.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.equipment.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [value]);

  const handleSelect = (name: string) => {
    onChange(name);
    setIsOpen(false);
  };

  const getCategoryBadgeClass = (category: ExerciseDefinition["category"]) => {
    switch (category) {
      case "Chest":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "Back":
        return "bg-sky-500/20 text-sky-300 border-sky-500/30";
      case "Legs":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "Shoulders":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "Arms":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "Core":
        return "bg-teal-500/20 text-teal-300 border-teal-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Input Field with Search Icon */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          placeholder={
            placeholder ||
            (isSuperset
              ? `Search or type Exercise #${exerciseIndex + 1}...`
              : "Search or type workout (e.g. Bench Press, Squat)...")
          }
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
        />

        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(true);
            }}
            className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Clear text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Live Dropdown Suggestions */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-40 mt-1.5 max-h-64 overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 divide-y divide-slate-800/60 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{value.trim() ? "Search Results" : "Popular Workouts"}</span>
            <span className="text-slate-500 text-[10px]">Click to select</span>
          </div>

          <div className="pt-1 space-y-0.5">
            {matchingExercises.length > 0 ? (
              matchingExercises.map((exercise) => {
                const isSelected = value.trim().toLowerCase() === exercise.name.toLowerCase();
                return (
                  <button
                    key={exercise.id}
                    type="button"
                    // use onMouseDown to trigger before blur/click-away
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(exercise.name);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                        : "text-slate-200 hover:bg-slate-800/90"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-100">{exercise.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(
                          exercise.category
                        )}`}
                      >
                        {exercise.category}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                <p>No predefined workout for &ldquo;{value}&rdquo;</p>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                  }}
                  className="mt-1.5 inline-block text-emerald-400 font-semibold hover:underline"
                >
                  Keep &ldquo;{value}&rdquo; as custom
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

