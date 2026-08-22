import type { RegistryVerificationStatus, TrustTier } from "./types";

export function trustTierLabel(tier?: TrustTier | string | null): string {
  switch (tier) {
    case "official_api":
      return "Official API";
    case "registry_verified":
      return "Registry lookup";
    case "format_valid":
      return "Format valid";
    default:
      return "Self-declared";
  }
}

export function registryStatusLabel(status?: RegistryVerificationStatus | string | null): string {
  switch (status) {
    case "verified":
      return "Found in registry";
    case "format_valid":
      return "Format valid";
    case "failed":
      return "Check failed";
    case "error":
      return "Lookup error";
    case "not_found":
      return "Not found";
    case "pending":
      return "Pending";
    default:
      return status || "Unknown";
  }
}

/** True only when a portal scrape or official API confirmed the record. */
export function isLedgerOrPortalVerified(
  status?: RegistryVerificationStatus | string | null,
  tier?: TrustTier | string | null,
): boolean {
  if (status !== "verified") return false;
  return tier === "registry_verified" || tier === "official_api";
}
