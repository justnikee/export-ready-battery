/**
 * Supplier portal session (S-05).
 *
 * Access token lives in memory only — never localStorage/sessionStorage —
 * matching the manufacturer pattern in lib/api.ts. Rehydration after reload
 * uses the HttpOnly `supplier_token` cookie (sent withCredentials; verified
 * by battery-api auth middleware).
 */

let supplierAccessToken: string | null = null;

export function getSupplierAccessToken(): string | null {
  return supplierAccessToken;
}

export function setSupplierAccessToken(token: string | null): void {
  supplierAccessToken = token;
}

/** Clear in-memory supplier token (call after logout or auth failure). */
export function clearSupplierSession(): void {
  supplierAccessToken = null;
}
