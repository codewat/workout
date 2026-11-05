// Web Audio & HTML5 Audio service
// Supports multiple customizable alarm sounds (Buzzer, Beep, Bell, Whistle, Chime) & volume control
// Uses HTMLAudioElement + Media Session API for transient audio focus (auto-resumes Spotify on stop)

export type AlarmSoundType = "buzzer" | "beep" | "bell" | "whistle" | "chime";

export interface AlarmSoundOption {
  id: AlarmSoundType;
  name: string;
  description: string;
  icon: string;
}

export const ALARM_SOUND_OPTIONS: AlarmSoundOption[] = [
  { id: "buzzer", name: "Gym Buzzer", description: "Loud electric horn / shot-clock buzz", icon: "⚡" },
  { id: "beep", name: "Digital Beep", description: "Crisp electronic watch triple-beep", icon: "⏰" },
  { id: "bell", name: "Boxing Bell", description: "Heavy metallic fight round bell", icon: "🥊" },
  { id: "whistle", name: "Referee Whistle", description: "High-pitch sports whistle trill", icon: "🎺" },
  { id: "chime", name: "Melodic Chime", description: "Pleasant two-tone chime", icon: "🔔" },
];

const wavCache: Partial<Record<AlarmSoundType, string>> = {};

export function getAlarmAudioUrl(type: AlarmSoundType = "buzzer"): string | null {
  if (typeof window === "undefined") return null;
  if (wavCache[type]) return wavCache[type]!;

  try {
    const sampleRate = 44100;
    // Transient Audio Focus (duration = 1.0s):
    // Tells Android to temporarily interrupt background music (Spotify/YouTube) during alarm,
    // and when the timer is stopped, Android AUTOMATICALLY resumes music playback!
    const duration = 1.0;
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

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const secondPart = t % 1.0;
      let sample = 0; // silence (16-bit signed: 0)

      if (type === "buzzer") {
        // Harsh electric gym buzzer: 160Hz + 240Hz square + saw harmonics
        const burst = secondPart < 0.38 || (secondPart >= 0.48 && secondPart < 0.86);
        if (burst) {
          const sq1 = Math.sin(2 * Math.PI * 160 * t) > 0 ? 1 : -1;
          const sq2 = Math.sin(2 * Math.PI * 240 * t) > 0 ? 0.7 : -0.7;
          const saw = ((t * 160) % 1 - 0.5) * 0.5;
          sample = Math.round((sq1 * 0.5 + sq2 * 0.3 + saw * 0.2) * 27000);
        }
      } else if (type === "bell") {
        // Metallic Boxing Bell strike at 0.0s and 0.45s with exponential decay
        const strikeTime = secondPart < 0.45 ? secondPart : secondPart - 0.45;
        const decay = Math.exp(-strikeTime * 7.5);
        const f1 = Math.sin(2 * Math.PI * 650 * t);
        const f2 = Math.sin(2 * Math.PI * 1280 * t) * 0.6;
        const f3 = Math.sin(2 * Math.PI * 1920 * t) * 0.3;
        sample = Math.round((f1 + f2 + f3) * decay * 25000);
      } else if (type === "whistle") {
        // Referee Whistle with 35Hz modulation
        const inBurst = secondPart < 0.4 || (secondPart >= 0.5 && secondPart < 0.9);
        if (inBurst) {
          const mod = 1 + 0.05 * Math.sin(2 * Math.PI * 35 * t);
          const f1 = Math.sin(2 * Math.PI * 2400 * mod * t);
          const f2 = Math.sin(2 * Math.PI * 2800 * mod * t);
          sample = Math.round((f1 + f2) * 0.5 * 25000);
        }
      } else if (type === "chime") {
        // Double Chime: D5 (587Hz) then A5 (880Hz)
        let strike = 0;
        let freq = 587;
        if (secondPart >= 0.35) {
          strike = secondPart - 0.35;
          freq = 880;
        } else {
          strike = secondPart;
          freq = 587;
        }
        const decay = Math.exp(-strike * 6);
        const tone = Math.sin(2 * Math.PI * freq * t) + 0.35 * Math.sin(2 * Math.PI * freq * 2 * t);
        sample = Math.round(tone * decay * 25000);
      } else {
        // Digital Beep (880Hz 3-burst)
        const inBeep =
          (secondPart >= 0 && secondPart < 0.14) ||
          (secondPart >= 0.22 && secondPart < 0.36) ||
          (secondPart >= 0.44 && secondPart < 0.58);
        if (inBeep) {
          const wave = Math.sin(2 * Math.PI * 880 * t) > 0 ? 1 : -1;
          sample = Math.round(wave * 27000);
        }
      }

      // Clamp to signed 16-bit integer range
      sample = Math.max(-32768, Math.min(32767, sample));
      view.setInt16(44 + i * 2, sample, true);
    }

    const blob = new Blob([buffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    wavCache[type] = url;
    return url;
  } catch {
    return null;
  }
}

class SoundService {
  private ctx: AudioContext | null = null;
  private alarmInterval: NodeJS.Timeout | null = null;
  private audioElement: HTMLAudioElement | null = null;
  public onStopCallback: (() => void) | null = null;

  private soundType: AlarmSoundType = "buzzer";
  private volume: number = 1.0; // 0.0 to 1.0

  // Background audio keep-alive (keeps Android/Chrome from sleeping while Spotify plays)
  private keepAliveNode: ScriptProcessorNode | null = null;
  private keepAliveSource: AudioBufferSourceNode | null = null;
  private alarmOscInterval: NodeJS.Timeout | null = null;

  setSoundType(type: AlarmSoundType) {
    this.soundType = type;
    if (this.audioElement) {
      const url = getAlarmAudioUrl(type);
      if (url) {
        this.audioElement.src = url;
        this.audioElement.load();
      }
    }
  }

  getSoundType(): AlarmSoundType {
    return this.soundType;
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx || this.ctx.state === "closed") {
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
      const url = getAlarmAudioUrl(this.soundType);
      if (url) {
        if (!this.audioElement) {
          this.audioElement = new Audio(url);
        } else {
          this.audioElement.src = url;
        }
        this.audioElement.loop = true;
        this.audioElement.muted = true; // Muted so it does NOT interrupt Spotify during rest countdown
        this.audioElement.volume = this.volume;
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

  // Plays a short Web Audio sound preview for the settings modal
  previewSound(type: AlarmSoundType = this.soundType, vol = this.volume) {
    if (typeof window === "undefined") return;
    try {
      const ctx = this.getContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      this.playWebAudioSound(type, vol);
    } catch {
      // Ignored
    }
  }

  // Synthesizes each sound type dynamically using Web Audio
  private playWebAudioSound(type = this.soundType, vol = this.volume) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const v = Math.max(0, Math.min(1, vol));

      if (type === "buzzer") {
        // Electric Gym Buzzer (sawtooth 160Hz + square 240Hz)
        [0, 0.42].forEach((offset) => {
          const start = now + offset;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = "sawtooth";
          osc1.frequency.setValueAtTime(160, start);
          osc2.type = "square";
          osc2.frequency.setValueAtTime(240, start);

          gain.gain.setValueAtTime(0.55 * v, start);
          gain.gain.setValueAtTime(0.55 * v, start + 0.32);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(start);
          osc2.start(start);
          osc1.stop(start + 0.36);
          osc2.stop(start + 0.36);
        });
      } else if (type === "bell") {
        // Metallic Boxing Bell strike with exponential decay
        [0, 0.45].forEach((offset) => {
          const start = now + offset;
          [650, 1280, 1920].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, start);

            const weight = idx === 0 ? 0.5 : idx === 1 ? 0.3 : 0.15;
            gain.gain.setValueAtTime(weight * v, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.42);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(start);
            osc.stop(start + 0.43);
          });
        });
      } else if (type === "whistle") {
        // Referee Sports Whistle
        [0, 0.45].forEach((offset) => {
          const start = now + offset;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = "sine";
          osc1.frequency.setValueAtTime(2400, start);
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(2800, start);

          gain.gain.setValueAtTime(0.4 * v, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(start);
          osc2.start(start);
          osc1.stop(start + 0.36);
          osc2.stop(start + 0.36);
        });
      } else if (type === "chime") {
        // Melodic Double Chime: D5 (587Hz) then A5 (880Hz)
        [
          { time: now, freq: 587 },
          { time: now + 0.3, freq: 880 },
        ].forEach((note) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(note.freq, note.time);

          gain.gain.setValueAtTime(0.5 * v, note.time);
          gain.gain.exponentialRampToValueAtTime(0.001, note.time + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(note.time);
          osc.stop(note.time + 0.42);
        });
      } else {
        // Digital Beep (3 fast 880Hz square wave beeps)
        for (let i = 0; i < 3; i++) {
          const start = now + i * 0.16;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(880, start);

          gain.gain.setValueAtTime(0.55 * v, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.11);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + 0.12);
        }
      }
    } catch {
      // Ignored
    }
  }

  // Continuous urgent Web Audio alarm (plays even if HTMLAudioElement is restricted)
  private startWebAudioAlarm() {
    this.stopWebAudioAlarm();
    this.playWebAudioSound(this.soundType, this.volume);
    this.alarmOscInterval = setInterval(() => {
      this.playWebAudioSound(this.soundType, this.volume);
    }, 750);
  }

  private stopWebAudioAlarm() {
    if (this.alarmOscInterval) {
      clearInterval(this.alarmOscInterval);
      this.alarmOscInterval = null;
    }
  }

  playBeep(freq = 600, duration = 0.1, type: OscillatorType = "sine") {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.3 * this.volume, ctx.currentTime);
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
      const wavUrl = getAlarmAudioUrl(this.soundType);
      if (!this.audioElement && wavUrl && typeof window !== "undefined") {
        this.audioElement = new Audio(wavUrl);
        this.audioElement.loop = true;
      } else if (this.audioElement && wavUrl) {
        this.audioElement.src = wavUrl;
      }

      if (this.audioElement) {
        this.audioElement.muted = false; // UNMUTE! Claims transient audio focus from Android OS
        this.audioElement.volume = Math.max(0, Math.min(1, this.volume));
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

  // Stop alarm, cleanly abandon OS audio focus so system audio hardware is released
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

    // Cleanly abandon media session and clear actions
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.playbackState = "none";
        navigator.mediaSession.metadata = null;
        try {
          navigator.mediaSession.setActionHandler("pause", null);
          navigator.mediaSession.setActionHandler("stop", null);
          navigator.mediaSession.setActionHandler("play", null);
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

        gain.gain.setValueAtTime(0.3 * this.volume, startTime);
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
