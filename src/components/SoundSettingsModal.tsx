"use client";

import React from "react";
import {
  X,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Check,
  Music,
} from "lucide-react";
import {
  AlarmSoundType,
  ALARM_SOUND_OPTIONS,
} from "../lib/audio";

interface SoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSoundEnabled: () => void;
  soundType: AlarmSoundType;
  onSelectSoundType: (type: AlarmSoundType) => void;
  volume: number;
  onChangeVolume: (vol: number) => void;
  onPreviewSound: (type: AlarmSoundType) => void;
}

export default function SoundSettingsModal({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSoundEnabled,
  soundType,
  onSelectSoundType,
  volume,
  onChangeVolume,
  onPreviewSound,
}: SoundSettingsModalProps) {
  if (!isOpen) return null;

  const volumePercent = Math.round(volume * 100);

  const VOLUME_PRESETS = [
    { label: "25%", value: 0.25 },
    { label: "50%", value: 0.5 },
    { label: "75%", value: 0.75 },
    { label: "100%", value: 1.0 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Timer Sound & Volume</h3>
              <p className="text-xs text-slate-400">Choose alarm sound tone and loudness</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 scrollbar-thin">
          {/* Master Sound Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                  soundEnabled
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-slate-800 border-slate-700 text-slate-500"
                }`}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <span className="font-bold text-sm text-white block">
                  {soundEnabled ? "Sound is ON" : "Sound is Muted"}
                </span>
                <span className="text-xs text-slate-400 block">
                  {soundEnabled ? "Timer alarm and countdown beeps active" : "Timer runs silently"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleSoundEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                soundEnabled ? "bg-emerald-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  soundEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Volume Control */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Volume1 className="w-3.5 h-3.5 text-emerald-400" /> Alarm Volume
              </span>
              <span className="text-sm font-extrabold text-emerald-400 tabular-nums">
                {volumePercent}%
              </span>
            </div>

            {/* Slider */}
            <div className="flex items-center gap-3">
              <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onChangeVolume(val);
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
              />
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {VOLUME_PRESETS.map((preset) => {
                const isActive = Math.abs(volume - preset.value) < 0.04;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      onChangeVolume(preset.value);
                      onPreviewSound(soundType);
                    }}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                        : "bg-slate-800/70 hover:bg-slate-800 text-slate-300 border-slate-700/60"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound Tone Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-emerald-400" /> Alarm Tone / Sound
              </span>
              <span className="text-[11px] text-slate-400">Tap to preview sound</span>
            </div>

            <div className="space-y-2">
              {ALARM_SOUND_OPTIONS.map((option) => {
                const isSelected = soundType === option.id;
                return (
                  <div
                    key={option.id}
                    onClick={() => {
                      onSelectSoundType(option.id);
                      onPreviewSound(option.id);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-emerald-950/25 border-emerald-500/60 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/40"
                        : "bg-slate-950/50 hover:bg-slate-800/50 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${
                          isSelected
                            ? "bg-emerald-500/20 border-emerald-500/40"
                            : "bg-slate-800 border-slate-700"
                        }`}
                      >
                        {option.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-white">{option.name}</h4>
                          {isSelected && (
                            <span className="text-[10px] uppercase font-extrabold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-md">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{option.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Explicit Preview Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewSound(option.id);
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold"
                        title="Preview sound"
                      >
                        <Play className="w-3.5 h-3.5 fill-emerald-400" />
                        <span className="hidden sm:inline">Play</span>
                      </button>

                      {/* Selected Checkmark */}
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isSelected
                            ? "bg-emerald-500 border-emerald-500 text-slate-950"
                            : "border-slate-700 bg-slate-800/50 text-transparent"
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
