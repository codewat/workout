"use client";

import React, { useState, useEffect } from "react";
import WorkoutSession from "../components/WorkoutSession";
import { WorkoutSetGroup } from "../types";
import { loadSavedWorkout, saveWorkoutToStorage, DEFAULT_ROUTINE } from "../lib/storage";
import { decompressRoutine, fetchRoutineFromCloud } from "../lib/sync";

export default function Home() {
  const [workoutList, setWorkoutList] = useState<WorkoutSetGroup[]>(DEFAULT_ROUTINE);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load from local storage or URL query on initial mount
  useEffect(() => {
    async function init() {
      // Check URL query parameters for cross-device sync
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const compressedData = params.get("d");
        const syncCode = params.get("code");

        // 1. Direct compressed data in URL (instant without network call)
        if (compressedData) {
          const decompressed = decompressRoutine(compressedData);
          if (decompressed && decompressed.length > 0) {
            setWorkoutList(decompressed);
            saveWorkoutToStorage(decompressed);
            setIsLoaded(true);
            // Clean URL query without reloading
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }
        }

        // 2. Fetch from cloud code if provided
        if (syncCode) {
          try {
            const fetched = await fetchRoutineFromCloud(syncCode);
            if (fetched && fetched.length > 0) {
              setWorkoutList(fetched);
              saveWorkoutToStorage(fetched);
              setIsLoaded(true);
              window.history.replaceState({}, document.title, window.location.pathname);
              return;
            }
          } catch {
            // Ignore error and fallback to saved
          }
        }
      }

      // Default: load from localStorage
      const saved = loadSavedWorkout();
      if (saved && saved.length > 0) {
        setWorkoutList(saved);
      }
      setIsLoaded(true);
    }

    init();
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
      <WorkoutSession
        workoutList={workoutList}
        onUpdateWorkoutList={handleUpdateWorkoutList}
      />
    </div>
  );
}
