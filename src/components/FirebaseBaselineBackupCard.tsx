import React, { useState, useEffect } from "react";
import { Database, ShieldCheck, RefreshCw, CheckCircle2, Clock, Layers, AlertCircle } from "lucide-react";
import { fetchBaselineStatus, triggerDailyBackup, BaselineStatus } from "../services/firebaseBackupService";

interface FirebaseBaselineBackupCardProps {
  compact?: boolean;
  className?: string;
  onBackupComplete?: () => void;
}

export default function FirebaseBaselineBackupCard({
  compact = false,
  className = "",
  onBackupComplete
}: FirebaseBaselineBackupCardProps) {
  const [status, setStatus] = useState<BaselineStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [backingUp, setBackingUp] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await fetchBaselineStatus();
      if (data) {
        setStatus(data);
      }
    } catch (err: any) {
      console.warn("Notice fetching baseline card status:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleRunBackup = async () => {
    try {
      setBackingUp(true);
      setSuccessMessage(null);
      setErrorMessage(null);
      const res = await triggerDailyBackup();
      if (res.success) {
        setSuccessMessage("Daily backup to Firebase Firestore succeeded!");
        await loadStatus();
        if (onBackupComplete) onBackupComplete();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(res.message || "Daily backup could not be completed.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to trigger backup.");
    } finally {
      setBackingUp(false);
    }
  };

  if (compact) {
    return (
      <div className={`p-3 bg-[#FAF7F0] border border-stone-300 flex items-center justify-between text-xs font-mono ${className}`}>
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-bold text-stone-800">
            Firebase Baseline: {status ? `${status.billsCount} Bills · ${status.votesCount} Votes` : "Connecting..."}
          </span>
          {status?.hasDailyBackup && (
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-semibold rounded-none">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Synced Today
            </span>
          )}
        </div>
        <button
          onClick={handleRunBackup}
          disabled={backingUp}
          className="inline-flex items-center px-2 py-1 text-[10px] uppercase font-bold tracking-wider bg-stone-900 text-white hover:bg-stone-800 transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${backingUp ? "animate-spin" : ""}`} />
          {backingUp ? "Backing Up..." : "Backup Now"}
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-[#FAF7F0] border-2 border-stone-800 p-5 shadow-sm ${className}`} id="firebase-baseline-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-300 pb-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-stone-900 text-amber-500 rounded-none shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-stone-900 text-base">
                Daily Backups & Firebase Baseline
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 uppercase tracking-wider border border-emerald-300">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-700" />
                Active & Protected
              </span>
            </div>
            <p className="text-[11px] font-mono text-stone-600 mt-0.5">
              Continuous Firestore snapshot preventing stale fallbacks during API drops
            </p>
          </div>
        </div>

        <button
          onClick={handleRunBackup}
          disabled={backingUp}
          className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-stone-900 text-[#FBF9F5] hover:bg-stone-800 transition shadow-sm disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${backingUp ? "animate-spin" : ""}`} />
          {backingUp ? "Writing to Firebase..." : "Run Daily Backup Now"}
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-2.5 bg-red-50 border border-red-300 text-red-900 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Snapshot metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 font-mono">
        <div className="p-3 bg-white border border-stone-300">
          <div className="text-[10px] uppercase text-stone-500 tracking-wider">Baseline Bills</div>
          <div className="text-xl font-bold text-stone-900 mt-1">
            {loading ? "..." : status?.billsCount ?? 0}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">accomplishments & legislation</div>
        </div>

        <div className="p-3 bg-white border border-stone-300">
          <div className="text-[10px] uppercase text-stone-500 tracking-wider">Roll-Call Votes</div>
          <div className="text-xl font-bold text-stone-900 mt-1">
            {loading ? "..." : status?.votesCount ?? 0}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">verified floor tallies</div>
        </div>

        <div className="p-3 bg-white border border-stone-300">
          <div className="text-[10px] uppercase text-stone-500 tracking-wider">Floor Sessions</div>
          <div className="text-xl font-bold text-stone-900 mt-1">
            {loading ? "..." : status?.sessionsCount ?? 0}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">hearings & debates</div>
        </div>

        <div className="p-3 bg-white border border-stone-300">
          <div className="text-[10px] uppercase text-stone-500 tracking-wider">Last Snapshot</div>
          <div className="text-sm font-bold text-stone-900 mt-1.5 flex items-center gap-1 truncate">
            <Clock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            {loading ? "..." : status?.lastBackupDate || "Today"}
          </div>
          <div className="text-[10px] text-emerald-700 mt-0.5 font-semibold">
            {status?.hasDailyBackup ? "Current for Today" : "Baseline preserved"}
          </div>
        </div>
      </div>

      <div className="text-xs text-stone-600 font-sans leading-relaxed flex items-start gap-2 bg-stone-100/70 p-3 border border-stone-200">
        <Layers className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
        <span>
          <strong>Why this matters:</strong> Whenever live Congress.gov or AI search grounding calls fail, time out, or hit rate limits, CapitolTrack automatically serves these daily baseline snapshots from Google Cloud Firestore. This guarantees the information displayed is always current to within 24 hours, rather than falling back to static fixtures from weeks ago.
        </span>
      </div>
    </div>
  );
}
