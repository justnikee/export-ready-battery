/**
 * Supplier portal session (S-05).
 *
 * Access token lives in memory only — never localStorage/sessionStorage —
 * matching the manufacturer pattern in lib/api.ts. Rehydration after reload
 * uses the HttpOnly `supplier_token` cookie, verified by battery-api.
 */

let supplierAccessToken: string | null = null;
let sessionVersion = 0;
let restoring: Promise<string | null> | undefined;
let sessionChannel: BroadcastChannel | undefined;

export function getSupplierSessionChannel(): BroadcastChannel | undefined {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
  try {
    return sessionChannel ??= new BroadcastChannel("anviora-supplier-session");
  } catch {
    // Browser restrictions on messaging do not affect the result of the auth request.
    return;
  }
}

export function getSupplierAccessToken(): string | null {
  return supplierAccessToken;
}

export function setSupplierAccessToken(token: string | null): void {
  sessionVersion++;
  restoring = undefined;
  supplierAccessToken = token;
}

export function restoreSupplierAccessToken(load: () => Promise<string>): Promise<string | null> {
  const version = sessionVersion;
  restoring ??= load()
    .then((token) => {
      if (version === sessionVersion && token) supplierAccessToken = token;
      return version === sessionVersion ? supplierAccessToken : null;
    })
    .finally(() => {
      if (version === sessionVersion) restoring = undefined;
    });
  return restoring;
}

/** Clear in-memory supplier token (call after logout or auth failure). */
export function clearSupplierSession(): void {
  setSupplierAccessToken(null);
}
