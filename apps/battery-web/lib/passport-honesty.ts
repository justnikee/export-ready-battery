/**
 * Wave 3 — public passport honesty (G13 lite).
 *
 * Carbon class, recycled content, and due diligence are Annex XIII fields
 * that Commission 71-point guidance (15 Aug 2026) does not require on the
 * day-one public passport. Never present them as Article 7 / Article 8 /
 * Article 48 legal status.
 */

export const PASSPORT_NOT_IN_FORCE = "Not in force / Not provided";

export const PASSPORT_FEB_2027_CAPTION =
  "Not required in the passport as of February 2027 (Commission guidance).";

export const PASSPORT_RESTRICTED_LINE =
  "Repair/dismantling detail is not on this public page.";

export type PassportAccessTier = "PUBLIC" | "PARTNER" | "REGULATOR";

export function isPublicAccessTier(tier?: string | null): boolean {
  return !tier || tier === "PUBLIC";
}

export function notInForceDisplay(
  value: string | number | null | undefined,
): { display: string; present: boolean } {
  if (value == null) {
    return { display: PASSPORT_NOT_IN_FORCE, present: false };
  }
  const text = String(value).trim();
  if (text === "") {
    return { display: PASSPORT_NOT_IN_FORCE, present: false };
  }
  return { display: text, present: true };
}
