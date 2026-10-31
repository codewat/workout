"use client";

import React, { useState, useEffect } from "react";
import WorkoutBuilder from "../components/WorkoutBuilder";
import WorkoutSession from "../components/WorkoutSession";
import { WorkoutSetGroup } from "../types";
import { loadSavedWorkout, saveWorkoutToStorage, DEFAULT_ROUTINE } from "../lib/storage";

export default function Home() {
  const [workoutList, setWorkoutList] = useState<WorkoutSetGroup[]>(DEFAULT_ROUTINE);
  const [currentScreen, setCurrentScreen] = useState<"BUILDER" | "SESSION">("SESSION");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load from local storage on initial mount
  useEffect(() => {
    const saved = loadSavedWorkout();
    if (saved && saved.length > 0) {
      setWorkoutList(saved);
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage whenever workoutList changes
  const handleUpdateWorkoutList = (newList: WorkoutSetGroup[]) => {
    setWorkoutList(newList);
    saveWorkoutToStorage(newList);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 antialiased selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {currentScreen === "BUILDER" ? (
        <WorkoutBuilder
          workoutList={workoutList}
          onUpdateWorkoutList={handleUpdateWorkoutList}
          onStartWorkout={() => {
            saveWorkoutToStorage(workoutList);
            setCurrentScreen("SESSION");
          }}
        />
      ) : (
        <WorkoutSession
          workoutList={workoutList}
          onBackToBuilder={() => setCurrentScreen("BUILDER")}
        />
      )}
    </div>
  );
}
