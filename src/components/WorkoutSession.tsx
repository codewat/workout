"use client";

import React, { useState, useEffect, useRef } from "react";
import { WorkoutSetGroup } from "../types";
import { sound } from "../lib/audio";
import { wakeLockManager } from "../lib/wakeLock";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Volume2,
  VolumeX,
  Smartphone,
  Trophy,
  PartyPopper,
} from "lucide-react";

interface WorkoutSessionProps {
  workoutList: WorkoutSetGroup[];
  onBackToBuilder: () => void;
}

const PRESET_DURATIONS = [
  { label: "30s", seconds: 30 },
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "3 min", seconds: 180 },
];

export default function WorkoutSession({
  workoutList,
  onBackToBuilder,
}: WorkoutSessionProps) {
  // Timer State
  const [initialDuration, setInitialDuration] = useState<number>(60);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isTimesUp, setIsTimesUp] = useState<boolean>(false);

  // Active Set Navigation
  const [selectedSetIndex, setSelectedSetIndex] = useState<number>(0);

  // Exercise completion state (set of completed exercise IDs)
  const [completedExerciseIds, setCompletedExerciseIds] = useState<Set<string>>(new Set());

  // Preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [screenAwake, setScreenAwake] = useState<boolean>(false);

  // Completion modal
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // Timer interval reference
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Request wake lock on component mount so screen doesn't sleep
  useEffect(() => {
    wakeLockManager.requestWakeLock((active) => setScreenAwake(active));
    return () => {
      wakeLockManager.releaseWakeLock();
      sound.stopAlarmLoop();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // When soundEnabled is disabled by user, stop any active alarm immediately
  useEffect(() => {
    if (!soundEnabled) {
      sound.stopAlarmLoop();
    }
  }, [soundEnabled]);

  // Timer tick effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setIsRunning(false);
            setIsTimesUp(true);

            // Trigger continuous looping alarm sound and vibration
            if (soundEnabled) {
              sound.startAlarmLoop();
            }
            return 0;
          }
          // Beep at 3, 2, 1 seconds countdown
          if (prev <= 4 && prev > 1 && soundEnabled) {
            sound.playBeep(440, 0.08);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, soundEnabled]);

  const handleStartTimer = () => {
    sound.stopAlarmLoop();
    setIsTimesUp(false);
    setIsRunning(true);
    if (soundEnabled) sound.playBeep(650, 0.08);
  };

  const handlePauseTimer = () => {
    setIsRunning(false);
  };

  const handleResetTimer = () => {
    sound.stopAlarmLoop();
    setIsRunning(false);
    setIsTimesUp(false);
    setTimeRemaining(initialDuration);
  };

  const handleSetPreset = (seconds: number) => {
    sound.stopAlarmLoop();
    setIsRunning(false);
    setIsTimesUp(false);
    setInitialDuration(seconds);
    setTimeRemaining(seconds);
  };

  // Tapping the big red button stops the continuous alarm and resets the timer
  const handleDismissTimesUp = () => {
    sound.stopAlarmLoop();
    setIsTimesUp(false);
    setTimeRemaining(initialDuration);
  };

  const toggleExerciseCompletion = (exerciseId: string) => {
    setCompletedExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
        if (soundEnabled) sound.playBeep(880, 0.06);
      }
      return next;
    });
  };

  const toggleWakeLock = async () => {
    if (screenAwake) {
      await wakeLockManager.releaseWakeLock();
      setScreenAwake(false);
    } else {
      const success = await wakeLockManager.requestWakeLock((active) => setScreenAwake(active));
      if (!success) {
        alert("Screen Wake Lock is not supported on this browser.");
      }
    }
  };

  const handleFinishWorkout = () => {
    sound.stopAlarmLoop();
    setShowCelebration(true);
    if (soundEnabled) {
      sound.playCelebration();
    }
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleBackToBuilder = () => {
    sound.stopAlarmLoop();
    onBackToBuilder();
  };

  // Helper values
  const currentGroup = workoutList[selectedSetIndex] || workoutList[0];
  const isSuperset = currentGroup ? currentGroup.exercises.length > 1 : false;

  const totalExercises = workoutList.reduce((acc, curr) => acc + curr.exercises.length, 0);
  const completedCount = completedExerciseIds.size;
  const progressPercent = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  const mins = Math.floor(timeRemaining / 60);
  const secs = (timeRemaining % 60).toString().padStart(2, "0");
  const timerPercentage = initialDuration > 0 ? (timeRemaining / initialDuration) * 100 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToBuilder}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Back to Routine Builder"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-bold text-base text-white leading-tight">Workout Session</h1>
              <p className="text-xs text-slate-400">
                {completedCount}/{totalExercises} exercises completed ({progressPercent}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Screen Wake Lock Toggle */}
            <button
              type="button"
              onClick={toggleWakeLock}
              className={`p-2 rounded-xl border text-xs transition-colors flex items-center gap-1 ${
                screenAwake
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                  : "bg-slate-900 border-slate-800 text-slate-500"
              }`}
              title={screenAwake ? "Screen Stay Awake is ON" : "Turn Screen Stay Awake ON"}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs transition-colors ${
                soundEnabled
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                  : "bg-slate-900 border-slate-800 text-slate-500"
              }`}
              title={soundEnabled ? "Sound enabled" : "Sound muted"}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-4 space-y-4">
        {/* === 1. FIXED REST TIMER CARD === */}
        <section
          className={`relative overflow-hidden rounded-3xl border transition-all p-5 ${
            isTimesUp
              ? "bg-rose-950/40 border-rose-500/60 shadow-2xl shadow-rose-950/60 animate-pulse ring-2 ring-rose-500/50"
              : isRunning
              ? "bg-gradient-to-b from-slate-900 to-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20"
              : "bg-slate-900/90 border-slate-800 shadow-md"
          }`}
        >
          {/* Progress bar background on active timer */}
          {isRunning && (
            <div
              className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-1000 ease-linear"
              style={{ width: `${timerPercentage}%` }}
            />
          )}

          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-1">
              Rest Timer
            </span>

            {/* Digital Clock Display */}
            <div
              className={`text-5xl sm:text-6xl font-black tracking-tight tabular-nums my-1 transition-colors ${
                isTimesUp
                  ? "text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.5)]"
                  : isRunning
                  ? "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                  : "text-slate-100"
              }`}
            >
              {mins}:{secs}
            </div>

            {/* Duration Presets */}
            <div className="flex items-center gap-1.5 mt-3 mb-4">
              {PRESET_DURATIONS.map((preset) => (
                <button
                  key={preset.seconds}
                  type="button"
                  onClick={() => handleSetPreset(preset.seconds)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    initialDuration === preset.seconds && !isTimesUp
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                      : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/60"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Red Alert Button when Time is Up (Tapping dismisses and stops continuous alarm) */}
            {isTimesUp ? (
              <button
                type="button"
                onClick={handleDismissTimesUp}
                className="w-full py-4 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-rose-600/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2 animate-bounce"
              >
                Time&apos;s Up! 🛑 (Tap to Silence Alarm)
              </button>
            ) : (
              /* Timer Control Buttons */
              <div className="flex items-center gap-3 w-full justify-center">
                {isRunning ? (
                  <button
                    type="button"
                    onClick={handlePauseTimer}
                    className="flex-1 py-3 px-5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm hover:bg-amber-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Pause className="w-4 h-4 fill-amber-300" /> Pause
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartTimer}
                    className="flex-1 py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-slate-950" /> Start Timer
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetTimer}
                  className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all active:scale-[0.98] flex items-center gap-1.5 text-sm font-semibold"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
              </div>
            )}
          </div>
        </section>

        {/* === 2. SET SELECTOR TABS (Horizontal Scroll) === */}
        <section className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {workoutList.map((group, index) => {
            const isSelected = selectedSetIndex === index;
            const setExercises = group.exercises;
            const allSetCompleted =
              setExercises.length > 0 &&
              setExercises.every((ex) => completedExerciseIds.has(ex.id));

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedSetIndex(index)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected
                    ? "bg-slate-100 text-slate-950 border-white shadow-md shadow-slate-100/10 scale-105"
                    : allSetCompleted
                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800"
                }`}
              >
                <span>Set {index + 1}</span>
                {allSetCompleted && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </section>

        {/* === 3. ACTIVE SET CARD & CLICKABLE EXERCISES === */}
        {currentGroup && (
          <section
            className={`rounded-3xl border transition-all p-5 shadow-xl ${
              isSuperset
                ? "bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-900 border-amber-500/30"
                : "bg-slate-900/90 border-slate-800"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Set #{selectedSetIndex + 1}
                </h2>
                {isSuperset && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Superset 🔥
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {currentGroup.exercises.length}{" "}
                {currentGroup.exercises.length === 1 ? "exercise" : "exercises"}
              </span>
            </div>

            {/* Clickable Exercise Cards */}
            <div className="space-y-3">
              {currentGroup.exercises.map((exercise, exIndex) => {
                const displayName = exercise.name.trim() || `Exercise ${exIndex + 1}`;
                const isCompleted = completedExerciseIds.has(exercise.id);

                return (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => toggleExerciseCompletion(exercise.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 active:scale-[0.98] ${
                      isCompleted
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30"
                        : "bg-slate-950/90 hover:bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs font-bold transition-all ${
                          isCompleted
                            ? "bg-white text-emerald-700 border-white"
                            : "border-slate-700 text-slate-400 bg-slate-900"
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : exIndex + 1}
                      </div>
                      <span className="font-semibold text-base tracking-tight">{displayName}</span>
                    </div>

                    <div className="flex items-center">
                      {isCompleted && (
                        <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                          Done
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Set Navigation Buttons (Previous & Next Set) */}
            <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setSelectedSetIndex((prev) => Math.max(0, prev - 1))}
                disabled={selectedSetIndex === 0}
                className="py-2.5 px-4 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {selectedSetIndex < workoutList.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setSelectedSetIndex((prev) => Math.min(workoutList.length - 1, prev + 1))}
                  className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-white text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                >
                  Next Set <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishWorkout}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  Finish Workout <PartyPopper className="w-4 h-4" />
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Celebration Modal when workout is completed */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-sm w-full bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 text-center shadow-2xl shadow-emerald-950/40 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <Trophy className="w-8 h-8 text-emerald-400" />
            </div>

            <h3 className="text-2xl font-black text-white">Workout Completed!</h3>
            <p className="text-slate-400 text-xs mt-1">
              Solid effort! You completed {completedCount} out of {totalExercises} exercises across{" "}
              {workoutList.length} sets.
            </p>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowCelebration(false);
                  handleBackToBuilder();
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all"
              >
                Back to Routine Builder
              </button>
              <button
                type="button"
                onClick={() => setShowCelebration(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all"
              >
                Review Sets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
