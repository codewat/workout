// Web Audio & HTML5 Audio service
// Uses HTMLAudioElement + Media Session API to automatically pause Spotify/YouTube when time is up!

let cachedAlarmUrl: string | null = null;

function getAlarmAudioUrl(): string | null {
  if (typeof window === "undefined") return null;
  if (cachedAlarmUrl) return cachedAlarmUrl;

  try {
    const sampleRate = 44100;
    // Android Chromium requires duration > 5.0 seconds to classify audio as "Persistent"
    // (MediaContentType::Persistent) instead of "Transient".
    // When > 5s, Chromium requests exclusive AUDIOFOCUS_GAIN which forces Spotify/YouTube to PAUSE
    // completely instead of just ducking/lowering the volume!
    const duration = 6.0;
    const numSamples = Math.floor(sampleRate * duration);
    const dataSize = numSamples * 2; // 16-bit PCM (2 bytes per sample)
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // Standard 16-bit PCM RIFF WAV Header (100% Android MediaPlayer compatible)
    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // 1 channel (mono)
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate (sampleRate * 1 * 2)
    view.setUint16(32, 2, true); // block align (1 * 2)
    view.setUint16(34, 16, true); // 16 bits per sample
    writeString(36, "data");
    view.setUint32(40, dataSize, true);

    // Generate repeating alert beeps across the 6 seconds
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const secondPart = t % 1.0;
      let sample = 0; // silence (16-bit signed: 0)
      const inBeep =
        (secondPart >= 0 && secondPart < 0.15) ||
        (secondPart >= 0.22 && secondPart < 0.37) ||
        (secondPart >= 0.44 && secondPart < 0.59);

      if (inBeep) {
        const wave = Math.sin(2 * Math.PI * 880 * t) > 0 ? 1 : -1;
        sample = Math.round(wave * 28000); // 16-bit amplitude (-28000 to +28000)
      }
      view.setInt16(44 + i * 2, sample, true);
    }

    const blob = new Blob([buffer], { type: "audio/wav" });
    cachedAlarmUrl = URL.createObjectURL(blob);
    return cachedAlarmUrl;
  } catch {
    return null;
  }
}

class SoundService {
  private ctx: AudioContext | null = null;
  private alarmInterval: NodeJS.Timeout | null = null;
  private audioElement: HTMLAudioElement | null = null;
  public onStopCallback: (() => void) | null = null;

  // Background audio keep-alive (keeps Android/Chrome from sleeping while Spotify plays)
  private keepAliveNode: ScriptProcessorNode | null = null;
  private keepAliveSource: AudioBufferSourceNode | null = null;
  private alarmOscInterval: NodeJS.Timeout | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Pre-unlock audio on user gesture (when user taps "Start Timer")
  // Plays muted HTMLAudioElement in background so OS allows instant unmuting at 0:00 without being blocked
  preload() {
    if (typeof window === "undefined") return;
    try {
      const ctx = this.getContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const url = getAlarmAudioUrl();
      if (url) {
        if (!this.audioElement) {
          this.audioElement = new Audio(url);
        } else {
          this.audioElement.src = url;
        }
        this.audioElement.loop = true;
        this.audioElement.muted = true; // Muted so it does NOT interrupt Spotify during rest countdown
        const p = this.audioElement.play();
        if (p !== undefined) {
          p.catch(() => {});
        }
      }
    } catch {
      // Ignored
    }
  }

  // Hardware Audio Clock Keep-Alive:
  // Runs silent audio buffers through the system audio server so Android does NOT freeze
  // the tab when user switches to Spotify. Calls onTick() every ~92ms from the hardware audio clock!
  startKeepAlive(onTick?: () => void) {
    if (typeof window === "undefined") return;
    try {
      this.stopKeepAlive();
      const ctx = this.getContext();
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      // 4096 samples at 44.1kHz = ~92.8ms callback interval
      const buffer = ctx.createBuffer(1, 4096, ctx.sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const scriptNode = ctx.createScriptProcessor(4096, 1, 1);
      scriptNode.onaudioprocess = (e) => {
        // Pure silence (zeros) so no audio is audible
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < output.length; i++) {
          output[i] = 0;
        }
        if (onTick) {
          onTick();
        }
      };

      const gain = ctx.createGain();
      gain.gain.value = 0;

      source.connect(scriptNode);
      scriptNode.connect(gain);
      gain.connect(ctx.destination);

      source.start();
      this.keepAliveSource = source;
      this.keepAliveNode = scriptNode;
    } catch {
      // Ignored
    }
  }

  stopKeepAlive() {
    if (this.keepAliveSource) {
      try {
        this.keepAliveSource.stop();
        this.keepAliveSource.disconnect();
      } catch {}
      this.keepAliveSource = null;
    }
    if (this.keepAliveNode) {
      try {
        this.keepAliveNode.disconnect();
        this.keepAliveNode.onaudioprocess = null;
      } catch {}
      this.keepAliveNode = null;
    }
  }

  // Continuous urgent Web Audio alarm (plays even if HTMLAudioElement is restricted)
  private startWebAudioAlarm() {
    this.stopWebAudioAlarm();
    this.playUrgentBeep();
    this.alarmOscInterval = setInterval(() => {
      this.playUrgentBeep();
    }, 750);
  }

  private stopWebAudioAlarm() {
    if (this.alarmOscInterval) {
      clearInterval(this.alarmOscInterval);
      this.alarmOscInterval = null;
    }
  }

  private playUrgentBeep() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const start = now + i * 0.16;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(880, start);

        gain.gain.setValueAtTime(0.6, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.11);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.12);
      }
    } catch {}
  }

  playBeep(freq = 600, duration = 0.1, type: OscillatorType = "sine") {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy or device restrictions
    }
  }

  // Continuous alarm sound that requests Audio Focus to PAUSE Spotify/YouTube/Facebook
  startAlarmLoop() {
    this.stopWebAudioAlarm();
    this.stopKeepAlive();

    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }

    // 1. Start continuous Web Audio alert (guaranteed loud sound through speakers)
    this.startWebAudioAlarm();

    // 2. Unmute pre-unlocked HTMLAudioElement to claim OS Audio Focus and pause Spotify/YouTube/Facebook
    try {
      const wavUrl = getAlarmAudioUrl();
      if (!this.audioElement && wavUrl && typeof window !== "undefined") {
        this.audioElement = new Audio(wavUrl);
        this.audioElement.loop = true;
      }

      if (this.audioElement) {
        this.audioElement.muted = false; // UNMUTE! Claims transient audio focus from Android OS
        this.audioElement.volume = 1.0;
        this.audioElement.currentTime = 0;
        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      }

      // Request system audio focus via Media Session API to pause other apps
      if (typeof window !== "undefined" && "mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "playing";
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "Time's Up! 🛑",
          artist: "Workoutwork Timer",
          album: "Rest Timer Alarm",
        });

        // Allow user to silence/dismiss alarm directly from lock screen or headphones
        try {
          navigator.mediaSession.setActionHandler("pause", () => {
            this.stopAlarmLoop();
          });
          navigator.mediaSession.setActionHandler("stop", () => {
            this.stopAlarmLoop();
          });
        } catch {
          // Actions might not be supported in older browsers
        }
      }
    } catch {
      // Ignored
    }

    // 3. Vibrate phone continuously
    this.vibrate([300, 150, 300, 150, 400]);
    this.alarmInterval = setInterval(() => {
      this.vibrate([300, 150, 300, 150, 400]);
    }, 1200);
  }

  // Stop alarm, release OS audio focus so Spotify automatically resumes
  stopAlarmLoop() {
    this.stopWebAudioAlarm();
    this.stopKeepAlive();

    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }

    // Teardown HTMLAudioElement to release hardware AudioTrack / decoder
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.audioElement.removeAttribute("src");
        this.audioElement.load();
      } catch {
        // Ignored
      }
      this.audioElement = null;
    }

    // Suspend Web Audio context if running so no ambient audio pipe stays open
    if (this.ctx && this.ctx.state === "running") {
      try {
        this.ctx.suspend().catch(() => {});
      } catch {
        // Ignored
      }
    }

    // Release media focus and notify OS to resume Spotify/YouTube
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.playbackState = "none";
        navigator.mediaSession.metadata = null;
        try {
          navigator.mediaSession.setActionHandler("pause", null);
          navigator.mediaSession.setActionHandler("stop", null);
        } catch {
          // Ignored
        }
      } catch {
        // Ignored
      }
    }

    // Notify listeners if registered
    if (this.onStopCallback) {
      const cb = this.onStopCallback;
      this.onStopCallback = null;
      cb();
    }
  }

  playCelebration() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // C major chord arpeggio: C4, E4, G4, C5
      const notes = [261.63, 329.63, 392.0, 523.25];
      notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.45);
      });
    } catch {
      // Audio error handling
    }
  }

  vibrate(pattern: number | number[] = [200, 100, 200]) {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignored on unsupported devices
      }
    }
  }
}

export const sound = new SoundService();
