import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, OperationType, handleFirestoreError } from "../firebase";

export interface BaselineRecord<T = any> {
  dataType: "bills" | "votes" | "accomplishments" | "sessions" | "alerts";
  backupDate: string;
  updatedAt: string;
  itemsCount: number;
  source: string;
  data: T[];
}

export interface DailyBackupSummary {
  backupId: string;
  backupDate: string;
  createdAt: string;
  triggeredBy: string;
  billsCount: number;
  votesCount: number;
  sessionsCount?: number;
  status: string;
  summary?: string;
}

export interface BaselineStatus {
  status: string;
  lastBackupDate: string;
  lastBackupTime: string;
  billsCount: number;
  votesCount: number;
  sessionsCount: number;
  hasDailyBackup: boolean;
  source: string;
}

/**
 * Retrieves baseline data from Firebase Firestore.
 * Fallback to localStorage if offline.
 */
export async function getFirebaseBaseline<T = any>(
  dataType: "bills" | "votes" | "accomplishments" | "sessions" | "alerts"
): Promise<T[] | null> {
  try {
    const snap = await getDoc(doc(db, "baseline_data", dataType));
    if (snap.exists()) {
      const record = snap.data() as BaselineRecord<T>;
      if (Array.isArray(record.data) && record.data.length > 0) {
        // Cache locally for offline resiliency
        try {
          localStorage.setItem(`baseline_${dataType}`, JSON.stringify(record.data));
          localStorage.setItem(`baseline_${dataType}_meta`, JSON.stringify({
            backupDate: record.backupDate,
            updatedAt: record.updatedAt
          }));
        } catch {
          // Ignore localStorage errors
        }
        return record.data;
      }
    }
  } catch (err: any) {
    console.warn(`[Firebase Baseline] Notice reading ${dataType} baseline:`, err?.message || err);
  }

  // Check localStorage fallback
  try {
    const saved = localStorage.getItem(`baseline_${dataType}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore fallback errors
  }

  return null;
}

/**
 * Saves fresh baseline data to Firebase Firestore.
 */
export async function saveFirebaseBaseline(
  dataType: "bills" | "votes" | "accomplishments" | "sessions" | "alerts",
  items: any[],
  source: string = "client_sync"
): Promise<boolean> {
  if (!items || items.length === 0) return false;

  const todayStr = new Date().toISOString().split("T")[0];
  const nowIso = new Date().toISOString();

  try {
    const record: BaselineRecord = {
      dataType,
      backupDate: todayStr,
      updatedAt: nowIso,
      itemsCount: items.length,
      source,
      data: items.slice(0, 50) // Keep bounded per Firestore size recommendations
    };

    await setDoc(doc(db, "baseline_data", dataType), record, { merge: true });
    
    // Save to local storage as quick-read cache
    try {
      localStorage.setItem(`baseline_${dataType}`, JSON.stringify(record.data));
      localStorage.setItem(`baseline_${dataType}_meta`, JSON.stringify({
        backupDate: record.backupDate,
        updatedAt: record.updatedAt
      }));
    } catch {
      // Ignore localStorage errors
    }

    return true;
  } catch (err: any) {
    console.warn(`[Firebase Baseline] Notice saving ${dataType} baseline:`, err?.message || err);
    return false;
  }
}

/**
 * Retrieves latest daily backup summary from Firebase Firestore.
 */
export async function getLatestDailyBackup(): Promise<DailyBackupSummary | null> {
  try {
    const snap = await getDoc(doc(db, "daily_backups", "latest"));
    if (snap.exists()) {
      return snap.data() as DailyBackupSummary;
    }
  } catch (err: any) {
    console.warn("[Firebase Backup] Notice fetching latest backup summary:", err?.message || err);
  }
  return null;
}

/**
 * Fetches status of the baseline and daily backups from the server API.
 */
export async function fetchBaselineStatus(): Promise<BaselineStatus | null> {
  try {
    const res = await fetch("/api/legislation/baseline/status");
    if (!res.ok) return null;
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.warn("[Baseline Status] Notice fetching baseline status:", err?.message || err);
    return null;
  }
}

/**
 * Triggers an immediate daily backup to Firebase Firestore.
 */
export async function triggerDailyBackup(): Promise<{ success: boolean; message: string; summary?: DailyBackupSummary }> {
  try {
    const res = await fetch("/api/legislation/baseline/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.warn("[Trigger Backup] Notice triggering backup:", err?.message || err);
    return { success: false, message: err?.message || "Failed to trigger daily backup" };
  }
}
