/**
 * Client-side cache for parsed datasheet results.
 * Keyed by SHA-256 hash of file content. TTL = 24h, max 10 entries.
 */

const CACHE_KEY = "anvaya_datasheet_cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_ENTRIES = 10;

interface CacheEntry {
  hash: string;
  filename: string;
  result: unknown;
  timestamp: number;
}

interface CacheStore {
  entries: CacheEntry[];
}

function getStore(): CacheStore {
  if (typeof window === "undefined") return { entries: [] };
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { entries: [] };
    return JSON.parse(raw) as CacheStore;
  } catch {
    return { entries: [] };
  }
}

function setStore(store: CacheStore) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    // Storage full or private mode — silently fail
  }
}

/**
 * Compute a SHA-256 hash of the file content for cache keys.
 */
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Get a cached parse result by file hash.
 */
export function getCachedResult(hash: string): unknown | null {
  const store = getStore();
  const now = Date.now();

  // Clean expired entries
  const valid = store.entries.filter((e) => now - e.timestamp < CACHE_TTL_MS);
  if (valid.length !== store.entries.length) {
    setStore({ entries: valid });
  }

  const entry = valid.find((e) => e.hash === hash);
  return entry ? entry.result : null;
}

/**
 * Store a parse result in the cache.
 */
export function setCachedResult(hash: string, filename: string, result: unknown): void {
  const store = getStore();
  const now = Date.now();

  // Remove expired entries
  let entries = store.entries.filter((e) => now - e.timestamp < CACHE_TTL_MS);

  // Remove existing entry with same hash
  entries = entries.filter((e) => e.hash !== hash);

  // Add new entry at front
  entries.unshift({ hash, filename, result, timestamp: now });

  // Trim to max
  if (entries.length > MAX_ENTRIES) {
    entries = entries.slice(0, MAX_ENTRIES);
  }

  setStore({ entries });
}

/**
 * Clear all cached datasheet results.
 */
export function clearDatasheetCache(): void {
  setStore({ entries: [] });
}

/**
 * Get list of cached entries (for UI display).
 */
export function getCacheEntries(): Omit<CacheEntry, "result">[] {
  const store = getStore();
  const now = Date.now();
  return store.entries
    .filter((e) => now - e.timestamp < CACHE_TTL_MS)
    .map(({ hash, filename, timestamp }) => ({ hash, filename, timestamp }));
}
