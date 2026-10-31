// Screen Wake Lock API helper so the phone screen doesn't dim during a workout
export class WakeLockManager {
  private sentinel: WakeLockSentinel | null = null;
  private isRequested = false;

  async requestWakeLock(onStatusChange?: (active: boolean) => void): Promise<boolean> {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) {
      return false;
    }

    try {
      this.isRequested = true;
      this.sentinel = await navigator.wakeLock.request("screen");
      onStatusChange?.(true);

      this.sentinel.addEventListener("release", () => {
        this.sentinel = null;
        onStatusChange?.(false);
      });

      // Re-acquire if visibility changes (e.g. user toggles back to the browser tab)
      document.addEventListener("visibilitychange", async () => {
        if (this.isRequested && document.visibilityState === "visible" && !this.sentinel) {
          try {
            this.sentinel = await navigator.wakeLock.request("screen");
            onStatusChange?.(true);
          } catch {
            // Silently handle if re-acquire fails
          }
        }
      });

      return true;
    } catch {
      onStatusChange?.(false);
      return false;
    }
  }

  async releaseWakeLock(onStatusChange?: (active: boolean) => void) {
    this.isRequested = false;
    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch {
        // Ignored
      }
      this.sentinel = null;
    }
    onStatusChange?.(false);
  }
}

export const wakeLockManager = new WakeLockManager();

