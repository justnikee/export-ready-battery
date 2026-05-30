/**
 * Auto-save batch wizard draft to localStorage.
 * Prevents data loss if the user closes the tab or the network fails.
 */

import type { BatchFormData } from "@/components/batches/batch-form-schema";

const DRAFT_KEY_PREFIX = "anvaya_batch_draft";
const DEBOUNCE_MS = 5000;

interface DraftEntry {
  data: BatchFormData;
  savedAt: string;
  step: number;
}

function getKey(tenantId: string): string {
  return `${DRAFT_KEY_PREFIX}_${tenantId}`;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedule a debounced draft save. Call this on every form change.
 */
export function scheduleDraftSave(
  tenantId: string,
  data: BatchFormData,
  step: number
): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveDraft(tenantId, data, step);
  }, DEBOUNCE_MS);
}

/**
 * Immediately save the draft to localStorage.
 */
export function saveDraft(
  tenantId: string,
  data: BatchFormData,
  step: number
): void {
  if (typeof window === "undefined") return;
  try {
    const entry: DraftEntry = { data, savedAt: new Date().toISOString(), step };
    localStorage.setItem(getKey(tenantId), JSON.stringify(entry));
  } catch {
    // Storage full or private mode — silently fail
  }
}

/**
 * Load a draft from localStorage. Returns null if no draft exists.
 */
export function loadDraft(tenantId: string): DraftEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getKey(tenantId));
    if (!raw) return null;
    return JSON.parse(raw) as DraftEntry;
  } catch {
    return null;
  }
}

/**
 * Clear the saved draft.
 */
export function clearDraft(tenantId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(getKey(tenantId));
  } catch {
    // silently fail
  }
}

/**
 * Check if a draft exists without parsing it.
 */
export function hasDraft(tenantId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(getKey(tenantId)) !== null;
}
