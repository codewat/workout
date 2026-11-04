"use client";

import React, { useState, useEffect, useRef } from "react";
import { WorkoutSetGroup, getExerciseBoxes } from "../types";
import { sound } from "../lib/audio";
import { wakeLockManager } from "../lib/wakeLock";
import confetti from "canvas-confetti";
import {
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
  Plus,
  Pencil,
  Dumbbell,
  Cloud,
  Bell,
  BellOff,
} from "lucide-react";
import SetEditorModal from "./SetEditorModal";
import SyncModal from "./SyncModal";

interface WorkoutSessionProps {
  workoutList: WorkoutSetGroup[];
  onUpdateWorkoutList: (newList: WorkoutSetGroup[]) => void;
}

const PRESET_DURATIONS = [
  { label: "30s", seconds: 30 },
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "3 min", seconds: 180 },
];

export default function WorkoutSession({
  workoutList,
  onUpdateWorkoutList,
}: WorkoutSessionProps) {
  // Timer State
  const [initialDuration, setInitialDuration] = useState<number>(60);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const isRunningRef = useRef<boolean>(false);
  const [isTimesUp, setIsTimesUp] = useState<boolean>(false);

  // Active Set Navigation
  const [selectedSetIndex, setSelectedSetIndex] = useState<number>(0);

  // Exercise completion state (set of completed exercise IDs)
  const [completedExerciseIds, setCompletedExerciseIds] = useState<Set<string>>(new Set());

  // Preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const soundEnabledRef = useRef<boolean>(true);
  const [screenAwake, setScreenAwake] = useState<boolean>(false);

  // Notification State (Top status bar notifications)
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const notificationsEnabledRef = useRef<boolean>(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const notificationPermissionRef = useRef<NotificationPermission>("default");

  // Completion modal
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // Cross-device Sync Modal State
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);

  // Set Editor Pop-up Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "CREATE" | "EDIT";
    targetIndex: number;
  }>({
    isOpen: false,
    mode: "CREATE",
    targetIndex: 0,
  });

  // Accurate Timer references (Wall-clock Date.now & Web Worker)
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const lastBeepRef = useRef<number | null>(null);
  const lastNotifSecondRef = useRef<number | null>(null);
  const activeNotificationRef = useRef<Notification | null>(null);

  // Keep refs synchronized with state to prevent stale closures
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    notificationsEnabledRef.current = notificationsEnabled;
  }, [notificationsEnabled]);

  useEffect(() => {
    notificationPermissionRef.current = notificationPermission;
  }, [notificationPermission]);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
      notificationPermissionRef.current = Notification.permission;
    }
  }, []);

  // Request wake lock on component mount so screen doesn't sleep
  useEffect(() => {
    wakeLockManager.requestWakeLock((active) => setScreenAwake(active));
    return () => {
      wakeLockManager.releaseWakeLock();
      sound.stopAlarmLoop();
      clearTimerNotification();
      if (intervalRef.current) clearInterval(intervalRef.current);
      workerRef.current?.terminate();
    };
  }, []);

  // When soundEnabled is disabled by user, stop any active alarm immediately
  useEffect(() => {
    if (!soundEnabled) {
      sound.stopAlarmLoop();
    }
  }, [soundEnabled]);

  // Sync alarm stop event (e.g. dismissed from notification or headset controls)
  useEffect(() => {
    sound.onStopCallback = () => {
      clearTimerNotification();
      setIsTimesUp(false);
      setTimeRemaining(initialDuration);
      if (typeof document !== "undefined") {
        document.title = "Workoutwork";
      }
    };
    return () => {
      sound.onStopCallback = null;
    };
  }, [initialDuration]);

  // Keep selectedSetIndex bounded when workoutList length changes
  useEffect(() => {
    if (workoutList.length === 0) {
      setSelectedSetIndex(0);
    } else if (selectedSetIndex >= workoutList.length) {
      setSelectedSetIndex(workoutList.length - 1);
    }
  }, [workoutList.length, selectedSetIndex]);

  // Notification helpers for top status bar
  const showTimerNotification = (remaining: number, isFinal = false) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (notificationPermissionRef.current !== "granted" || !notificationsEnabledRef.current) return;

    try {
      const minsLeft = Math.floor(remaining / 60);
      const secsLeft = (remaining % 60).toString().padStart(2, "0");
      const timeStr = `${minsLeft}:${secsLeft}`;
      const title = isFinal ? "🛑 TIME'S UP! (0:00)" : `⏱️ Rest Timer: ${timeStr}`;
      const body = isFinal
        ? "Rest period finished! Ready for the next set."
        : "Workoutwork • Tap to return to workout";

      const options: NotificationOptions & { renotify?: boolean; silent?: boolean } = {
        tag: "workoutwork-rest-timer",
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        silent: !isFinal,
        renotify: isFinal,
      };

      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready
          .then((reg) => reg.showNotification(title, options))
          .catch(() => {});
      } else {
        if (activeNotificationRef.current) {
          try {
            activeNotificationRef.current.close();
          } catch {}
        }
        const notif = new Notification(title, options);
        activeNotificationRef.current = notif;
        notif.onclick = () => {
          try {
            window.focus();
          } catch {}
          if (isFinal) {
            sound.stopAlarmLoop();
            setIsTimesUp(false);
          }
          try {
            notif.close();
          } catch {}
        };
      }
    } catch {
      // Handled silently
    }
  };

  const clearTimerNotification = () => {
    if (activeNotificationRef.current) {
      try {
        activeNotificationRef.current.close();
      } catch {}
      activeNotificationRef.current = null;
    }
    if (typeof window !== "undefined" && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.getNotifications({ tag: "workoutwork-rest-timer" }).then((notifs) => {
            notifs.forEach((n) => n.close());
          }).catch(() => {});
        })
        .catch(() => {});
    }
  };

  const handleToggleNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Notifications are not supported in this browser.");
      return;
    }

    if (Notification.permission === "default") {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        notificationPermissionRef.current = perm;
        if (perm === "granted") {
          setNotificationsEnabled(true);
          notificationsEnabledRef.current = true;
        }
      } catch {
        // Ignored
      }
    } else if (Notification.permission === "granted") {
      setNotificationsEnabled((prev) => !prev);
    } else if (Notification.permission === "denied") {
      alert(
        "Notifications are blocked in your browser settings. Please enable notifications for this site to view the rest timer at the top of your screen."
      );
    }
  };

  // Initialize background timer Web Worker so timers don't throttle when app is in background
  useEffect(() => {
    if (typeof window === "undefined" || typeof Worker === "undefined") return;
    try {
      const workerScript = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'START') {
            if (timer) clearInterval(timer);
            timer = setInterval(function() {
              self.postMessage('TICK');
            }, 300);
          } else if (e.data === 'STOP') {
            if (timer) clearInterval(timer);
            timer = null;
          }
        };
      `;
      const blob = new Blob([workerScript], { type: "application/javascript" });
      const worker = new Worker(URL.createObjectURL(blob));
      workerRef.current = worker;

      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    } catch {
      // Web Worker fallback to setInterval
    }
  }, []);

  // Accurate wall-clock tick calculation
  const tickTimer = () => {
    if (!endTimeRef.current || !isRunningRef.current) return;
    const now = Date.now();
    const diffMs = endTimeRef.current - now;
    const remaining = Math.max(0, Math.ceil(diffMs / 1000));

    setTimeRemaining(remaining);
    const minsLeft = Math.floor(remaining / 60);
    const secsLeft = (remaining % 60).toString().padStart(2, "0");
    if (typeof document !== "undefined") {
      document.title =
        remaining > 0
          ? `(${minsLeft}:${secsLeft}) Rest Timer | Workoutwork`
          : "🛑 Time's Up! | Workoutwork";
    }

    if (remaining <= 0) {
      endTimeRef.current = null;
      setIsRunning(false);
      isRunningRef.current = false;
      setIsTimesUp(true);
      workerRef.current?.postMessage("STOP");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (soundEnabledRef.current) {
        sound.startAlarmLoop();
      }
      showTimerNotification(0, true);
      return;
    }

    // 3, 2, 1 countdown beeps
    if (remaining <= 3 && remaining > 0 && soundEnabledRef.current) {
      if (lastBeepRef.current !== remaining) {
        lastBeepRef.current = remaining;
        sound.playBeep(440, 0.08);
      }
    }

    // Update status bar notification if backgrounded
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "hidden" &&
      notificationsEnabledRef.current &&
      notificationPermissionRef.current === "granted"
    ) {
      const lastNotif = lastNotifSecondRef.current;
      if (lastNotif === null || lastNotif - remaining >= 5 || remaining <= 5) {
        lastNotifSecondRef.current = remaining;
        showTimerNotification(remaining, false);
      }
    }
  };

  // Wire worker messages to timer ticks
  useEffect(() => {
    const worker = workerRef.current;
    if (worker) {
      worker.onmessage = (e) => {
        if (e.data === "TICK" && isRunningRef.current) {
          tickTimer();
        }
      };
    }
  });

  // Secondary interval fallback alongside Web Worker
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        tickTimer();
      }, 300);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Synchronize immediately on visibility change or window focus
  useEffect(() => {
    const handleSync = () => {
      if (isRunningRef.current && endTimeRef.current) {
        tickTimer();
      }
      // If user returns to foreground and alarm is not sounding, clear the ongoing countdown notification
      if (document.visibilityState === "visible" && !isTimesUp) {
        clearTimerNotification();
      }
    };

    document.addEventListener("visibilitychange", handleSync);
    window.addEventListener("focus", handleSync);
    window.addEventListener("pageshow", handleSync);

    return () => {
      document.removeEventListener("visibilitychange", handleSync);
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("pageshow", handleSync);
    };
  }, [isTimesUp]);

  const handleStartTimer = () => {
    sound.preload();
    sound.stopAlarmLoop();
    clearTimerNotification();

    // Auto-prompt notification permission on first user tap if still default
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission()
        .then((perm) => {
          setNotificationPermission(perm);
          notificationPermissionRef.current = perm;
          if (perm === "granted") {
            setNotificationsEnabled(true);
            notificationsEnabledRef.current = true;
          }
        })
        .catch(() => {});
    }

    const duration = timeRemaining > 0 ? timeRemaining : initialDuration;
    endTimeRef.current = Date.now() + duration * 1000;
    lastBeepRef.current = null;
    lastNotifSecondRef.current = null;

    setIsTimesUp(false);
    setIsRunning(true);
    isRunningRef.current = true;
    if (soundEnabled) sound.playBeep(650, 0.08);

    workerRef.current?.postMessage("START");
  };

  const handlePauseTimer = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    workerRef.current?.postMessage("STOP");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (endTimeRef.current) {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeRemaining(remaining);
      endTimeRef.current = null;
    }
    clearTimerNotification();
    if (typeof document !== "undefined") {
      document.title = "Workoutwork";
    }
  };

  const handleResetTimer = () => {
    sound.stopAlarmLoop();
    clearTimerNotification();
    workerRef.current?.postMessage("STOP");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    endTimeRef.current = null;
    setIsRunning(false);
    isRunningRef.current = false;
    setIsTimesUp(false);
    setTimeRemaining(initialDuration);
    if (typeof document !== "undefined") {
      document.title = "Workoutwork";
    }
  };

  const handleSetPreset = (seconds: number) => {
    sound.stopAlarmLoop();
    clearTimerNotification();
    workerRef.current?.postMessage("STOP");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    endTimeRef.current = null;
    setIsRunning(false);
    isRunningRef.current = false;
    setIsTimesUp(false);
    setInitialDuration(seconds);
    setTimeRemaining(seconds);
    if (typeof document !== "undefined") {
      document.title = "Workoutwork";
    }
  };

  // Tapping the big red button stops the continuous alarm and resets the timer
  const handleDismissTimesUp = () => {
    sound.stopAlarmLoop();
    clearTimerNotification();
    setIsTimesUp(false);
    setTimeRemaining(initialDuration);
    if (typeof document !== "undefined") {
      document.title = "Workoutwork";
    }
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
    clearTimerNotification();
    workerRef.current?.postMessage("STOP");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    endTimeRef.current = null;
    setIsRunning(false);
    isRunningRef.current = false;
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

  // Modal handlers
  const handleOpenCreateModal = () => {
    setModalState({
      isOpen: true,
      mode: "CREATE",
      targetIndex: workoutList.length,
    });
  };

  const handleOpenEditModal = (index: number) => {
    setModalState({
      isOpen: true,
      mode: "EDIT",
      targetIndex: index,
    });
  };

  const handleSaveSetFromModal = (savedGroup: WorkoutSetGroup) => {
    if (modalState.mode === "CREATE") {
      const updated = [...workoutList, savedGroup];
      onUpdateWorkoutList(updated);
      setSelectedSetIndex(updated.length - 1);
    } else {
      const updated = workoutList.map((g, idx) =>
        idx === modalState.targetIndex ? savedGroup : g
      );
      onUpdateWorkoutList(updated);
    }
  };

  const handleDeleteSetFromModal = () => {
    const updated = workoutList.filter((_, idx) => idx !== modalState.targetIndex);
    onUpdateWorkoutList(updated);
    setSelectedSetIndex((prev) => Math.max(0, Math.min(prev, updated.length - 1)));
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Dumbbell className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white leading-tight">Workoutwork</h1>
              <p className="text-[11px] text-slate-400">
                {completedCount}/{totalExercises} exercises completed ({progressPercent}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Cross-Device Sync Button */}
            <button
              type="button"
              onClick={() => setShowSyncModal(true)}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors flex items-center gap-1.5"
              title="Sync workouts to phone or other devices"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Sync</span>
            </button>

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

            {/* Top Status Bar Notification Toggle */}
            <button
              type="button"
              onClick={handleToggleNotifications}
              className={`p-2 rounded-xl border text-xs transition-colors flex items-center gap-1 ${
                notificationsEnabled && notificationPermission === "granted"
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                  : "bg-slate-900 border-slate-800 text-slate-500"
              }`}
              title={
                notificationPermission === "granted"
                  ? notificationsEnabled
                    ? "Top status bar timer notification is ON"
                    : "Top status bar timer notification is muted"
                  : notificationPermission === "denied"
                  ? "Notifications blocked in browser settings"
                  : "Click to enable top status bar timer notification"
              }
            >
              {notificationsEnabled && notificationPermission === "granted" ? (
                <Bell className="w-3.5 h-3.5" />
              ) : (
                <BellOff className="w-3.5 h-3.5" />
              )}
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
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-4 space-y-4 pb-20">
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

            {/* Status Bar Notification Hint if not yet requested */}
            {notificationPermission === "default" && !isTimesUp && (
              <button
                type="button"
                onClick={handleToggleNotifications}
                className="mb-3 text-[11px] text-emerald-400/90 hover:text-emerald-300 flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-emerald-400" />
                <span>Show timer in phone notification bar when using Spotify</span>
              </button>
            )}

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

        {/* === 2. SET SELECTOR TABS & ADD NEW SET BUTTON === */}
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

          {/* Add New Set Button right beside the set buttons! */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all active:scale-95 shadow-sm"
            title="Create a new set"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Set</span>
          </button>
        </section>

        {/* === 3. ACTIVE SET CARD & CLICKABLE EXERCISES === */}
        {workoutList.length === 0 ? (
          <section className="text-center py-12 px-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <Dumbbell className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="font-bold text-white text-base">No sets in this workout yet</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Tap &ldquo;Add New Set&rdquo; above to create your first set with exercises.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" /> Add New Set
            </button>
          </section>
        ) : currentGroup ? (
          <section
            className={`rounded-3xl border transition-all p-5 shadow-xl ${
              isSuperset
                ? "bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-900 border-amber-500/30"
                : "bg-slate-900/90 border-slate-800"
            }`}
          >
            {/* Set Header with Edit Set Button */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Set #{selectedSetIndex + 1}
                </h2>
                <span className="text-xs text-slate-400">
                  ({currentGroup.exercises.length}{" "}
                  {currentGroup.exercises.length === 1 ? "exercise" : "exercises"})
                </span>
              </div>

              {/* Edit Set Button inside the Set Box */}
              <button
                type="button"
                onClick={() => handleOpenEditModal(selectedSetIndex)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm active:scale-95"
                title="Edit or delete workouts in this set"
              >
                <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                <span>Edit Set</span>
              </button>
            </div>

            {/* Clickable Exercise Cards */}
            <div className="space-y-3">
              {getExerciseBoxes(currentGroup.exercises).map((box) => (
                <div
                  key={box.id}
                  className={
                    box.isSupersetBox
                      ? "rounded-2xl border-2 border-amber-500/40 bg-amber-950/15 p-3 space-y-2.5 shadow-md shadow-amber-950/20"
                      : "space-y-2"
                  }
                >
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

                  {box.items.map(({ exercise, originalIndex }) => {
                    const displayName =
                      exercise.name.trim() || `Exercise ${originalIndex + 1}`;
                    const isCompleted = completedExerciseIds.has(exercise.id);

                    return (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={() => toggleExerciseCompletion(exercise.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 active:scale-[0.98] ${
                          isCompleted
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30"
                            : box.isSupersetBox
                            ? "bg-slate-900/90 hover:bg-slate-900 text-slate-200 border-amber-500/30"
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
                            {isCompleted ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              originalIndex + 1
                            )}
                          </div>
                          <span className="font-semibold text-base tracking-tight">
                            {displayName}
                          </span>
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
              ))}
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
        ) : null}
      </main>

      {/* Set Pop-up Modal for Creating / Editing a Single Set */}
      <SetEditorModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        setIndex={modalState.targetIndex}
        initialGroup={
          modalState.mode === "EDIT" ? workoutList[modalState.targetIndex] || null : null
        }
        onSaveSet={handleSaveSetFromModal}
        onDeleteSet={modalState.mode === "EDIT" ? handleDeleteSetFromModal : undefined}
      />

      {/* Cross-Device Sync Modal */}
      <SyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        workoutList={workoutList}
        onApplyRoutine={(newRoutine) => {
          onUpdateWorkoutList(newRoutine);
          setSelectedSetIndex(0);
        }}
      />

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
                  setSelectedSetIndex(0);
                  setCompletedExerciseIds(new Set());
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all"
              >
                Restart Workout Session
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
