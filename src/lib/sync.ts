import { WorkoutSetGroup } from "../types";
import LZString from "lz-string";
import QRCode from "qrcode";

const SYNC_CODE_STORAGE_KEY = "workoutwork_active_sync_code";

// Generate a random 6-character code (e.g. "WAT-724")
export function generateRandomSyncCode(): string {
  const letters = "WATFITGYMCOD";
  const prefix = letters.substring(0, 3);
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
}

export function getSavedSyncCode(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(SYNC_CODE_STORAGE_KEY) || "";
}

export function saveActiveSyncCode(code: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SYNC_CODE_STORAGE_KEY, code.trim().toUpperCase());
}

// Compress routine into compact URL-safe string
export function compressRoutine(routine: WorkoutSetGroup[]): string {
  try {
    const json = JSON.stringify(routine);
    return LZString.compressToEncodedURIComponent(json);
  } catch {
    return "";
  }
}

// Decompress routine from URL-safe string
export function decompressRoutine(compressed: string): WorkoutSetGroup[] | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

// Save to cloud API
export async function uploadRoutineToCloud(code: string, routine: WorkoutSetGroup[]) {
  const res = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, routine }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to upload to cloud");
  }

  saveActiveSyncCode(code);
  return await res.json();
}

// Fetch from cloud API
export async function fetchRoutineFromCloud(code: string): Promise<WorkoutSetGroup[]> {
  const res = await fetch(`/api/sync?code=${encodeURIComponent(code.trim().toUpperCase())}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to find workout for this code");
  }

  const data = await res.json();
  if (Array.isArray(data.routine)) {
    saveActiveSyncCode(code);
    return data.routine;
  }

  throw new Error("Invalid routine data received from cloud");
}

// Generate QR Code data URL
export async function generateQRCode(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      margin: 1.5,
      width: 240,
      color: {
        dark: "#020617",
        light: "#ffffff",
      },
    });
  } catch {
    return "";
  }
}

