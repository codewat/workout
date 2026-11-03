"use client";

import React, { useState, useEffect } from "react";
import { WorkoutSetGroup } from "../types";
import {
  X,
  Cloud,
  Download,
  Copy,
  Check,
  QrCode,
  Smartphone,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  generateRandomSyncCode,
  getSavedSyncCode,
  uploadRoutineToCloud,
  fetchRoutineFromCloud,
  compressRoutine,
  generateQRCode,
} from "../lib/sync";

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutList: WorkoutSetGroup[];
  onApplyRoutine: (routine: WorkoutSetGroup[]) => void;
}

export default function SyncModal({
  isOpen,
  onClose,
  workoutList,
  onApplyRoutine,
}: SyncModalProps) {
  const [activeTab, setActiveTab] = useState<"SAVE" | "LOAD">("SAVE");

  // Save tab states
  const [syncCode, setSyncCode] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");

  // Load tab states
  const [inputCode, setInputCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>("");
  const [loadSuccessMessage, setLoadSuccessMessage] = useState<string>("");

  // Initialize sync code on open
  useEffect(() => {
    if (isOpen) {
      const saved = getSavedSyncCode();
      const codeToUse = saved || generateRandomSyncCode();
      setSyncCode(codeToUse);
      setSaveSuccess(false);
      setSaveError("");
      setLoadError("");
      setLoadSuccessMessage("");

      // Generate share URL and QR code
      if (typeof window !== "undefined") {
        const compressed = compressRoutine(workoutList);
        const url = `${window.location.origin}/?code=${encodeURIComponent(
          codeToUse
        )}&d=${compressed}`;
        setShareUrl(url);

        generateQRCode(url).then((qr) => {
          setQrCodeUrl(qr);
        });
      }
    }
  }, [isOpen, workoutList]);

  if (!isOpen) return null;

  // Handle uploading current routine to cloud
  const handleUpload = async () => {
    if (!syncCode.trim()) {
      setSaveError("Please enter or generate a sync code");
      return;
    }

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      await uploadRoutineToCloud(syncCode.trim(), workoutList);
      setSaveSuccess(true);

      // Re-generate share URL and QR code
      if (typeof window !== "undefined") {
        const compressed = compressRoutine(workoutList);
        const url = `${window.location.origin}/?code=${encodeURIComponent(
          syncCode.trim()
        )}&d=${compressed}`;
        setShareUrl(url);
        const qr = await generateQRCode(url);
        setQrCodeUrl(qr);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sync to cloud";
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle downloading routine from cloud
  const handleFetch = async () => {
    if (!inputCode.trim()) {
      setLoadError("Please enter your sync code");
      return;
    }

    setIsLoading(true);
    setLoadError("");
    setLoadSuccessMessage("");

    try {
      const fetched = await fetchRoutineFromCloud(inputCode.trim());
      onApplyRoutine(fetched);
      setLoadSuccessMessage(
        `Successfully loaded ${fetched.length} sets from code: ${inputCode.trim().toUpperCase()}!`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync code not found";
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: "LINK" | "CODE") => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === "LINK") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Cross-Device Sync</h3>
              <p className="text-xs text-slate-400">Use on your phone, laptop, or other devices</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("SAVE")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "SAVE"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700/80"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Save to Cloud</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("LOAD")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "LOAD"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700/80"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Load with Code</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "SAVE" ? (
            /* TAB 1: SAVE / SYNC */
            <div className="space-y-4">
              {/* Sync Code Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Your Sync Code</label>
                  <button
                    type="button"
                    onClick={() => setSyncCode(generateRandomSyncCode())}
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Generate New
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={syncCode}
                    onChange={(e) => setSyncCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WAT-123 or codewat"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold tracking-wider text-emerald-400 uppercase placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(syncCode, "CODE")}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Copy code"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Upload to Cloud Button */}
              <button
                type="button"
                onClick={handleUpload}
                disabled={isSaving}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4 fill-slate-950" />
                )}
                <span>{isSaving ? "Saving to Cloud..." : "Save Routine to Cloud"}</span>
              </button>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Routine saved! You can now use code <strong>{syncCode}</strong> on your phone.</span>
                </div>
              )}

              {saveError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                  {saveError}
                </div>
              )}

              {/* Instant QR Code & Share Link */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-amber-400" /> Instant Phone Scan (No Typing)
                </span>

                {qrCodeUrl ? (
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-800 max-w-[210px] mx-auto shadow-md">
                    <img
                      src={qrCodeUrl}
                      alt="Sync QR Code"
                      className="w-44 h-44 object-contain rounded-lg"
                    />
                    <span className="text-[10px] text-slate-700 font-semibold mt-1 flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-slate-900" /> Scan with Phone Camera
                    </span>
                  </div>
                ) : null}

                {/* Direct Link */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">Direct Share / Sync Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 truncate font-mono select-all"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(shareUrl, "LINK")}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Link
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: LOAD WITH CODE */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Enter Sync Code from your other device
                </label>
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WAT-724 or codewat"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-base font-mono font-bold tracking-widest text-emerald-400 uppercase placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleFetch}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 fill-slate-950" />
                )}
                <span>{isLoading ? "Fetching Workout..." : "Load Workout Sets"}</span>
              </button>

              {loadSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{loadSuccessMessage}</span>
                </div>
              )}

              {loadError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                  {loadError}
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-1.5 text-xs text-slate-400">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> How to use on your phone:
                </span>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
                  <li>On your laptop, click <strong>Save to Cloud</strong>.</li>
                  <li>Copy your sync code (or scan the QR code with your phone camera).</li>
                  <li>Open the app on your phone, click <strong>Sync Devices</strong> &rarr; enter that code, and tap <strong>Load Workout Sets</strong>!</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
