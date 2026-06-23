/**
 * Auto-save batch wizard drafts to localStorage.
 * Prevents data loss if the user closes the tab or the network fails.
 * Supports multiple named drafts per tenant (capped, oldest evicted first)
 * so a user can start several batches without losing earlier in-progress work.
 */

import type { BatchFormData } from "@/components/batches/batch-form-schema";

const DRAFT_KEY_PREFIX = "anvaya_batch_draft";
const DEBOUNCE_MS = 5000;
const MAX_DRAFTS = 5;

export interface DraftSlot {
  id: string;
  data: Partial<BatchFormData>;
  savedAt: string;
  step: number;
  batchName: string;
  marketRegion: string;
}

function getKey(tenantId: string): string {
  return `${DRAFT_KEY_PREFIX}_${tenantId}`;
}

function readSlots(tenantId: string): DraftSlot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getKey(tenantId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSlots(tenantId: string, slots: DraftSlot[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getKey(tenantId), JSON.stringify(slots));
  } catch {
    // Storage full or private mode — silently fail
  }
}

/**
 * List saved drafts for a tenant, most recently saved first.
 */
export function listDrafts(tenantId: string): DraftSlot[] {
  return readSlots(tenantId).sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
}

/**
 * Immediately save (create or update) a draft slot. Evicts the oldest
 * slot once more than MAX_DRAFTS exist.
 */
export function saveDraftSlot(
  tenantId: string,
  id: string,
  data: BatchFormData,
  step: number
): void {
  const slots = readSlots(tenantId).filter((s) => s.id !== id);
  slots.push({
    id,
    data,
    savedAt: new Date().toISOString(),
    step,
    batchName: data.batchName || "Untitled batch",
    marketRegion: data.marketRegion,
  });
  slots.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  writeSlots(tenantId, slots.slice(0, MAX_DRAFTS));
}

/**
 * Load a single draft slot by id. Returns null if it doesn't exist.
 */
export function loadDraftSlot(tenantId: string, id: string): DraftSlot | null {
  return readSlots(tenantId).find((s) => s.id === id) || null;
}

/**
 * Delete a single draft slot (e.g. after submit, or explicit discard).
 */
export function deleteDraftSlot(tenantId: string, id: string): void {
  writeSlots(tenantId, readSlots(tenantId).filter((s) => s.id !== id));
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedule a debounced save for one draft slot. Call this on every form
 * change. `onSaved` (if provided) fires after the write actually happens,
 * so callers can drive a "Saved" indicator.
 */
export function scheduleDraftSave(
  tenantId: string,
  id: string,
  data: BatchFormData,
  step: number,
  onSaved?: () => void
): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveDraftSlot(tenantId, id, data, step);
    onSaved?.();
  }, DEBOUNCE_MS);
}
