/** QR ZIP and label PDF may be issued only after activation. */
export function canIssueProductionArtifacts(status?: string | null): boolean {
  return status === "ACTIVE" || status === "ARCHIVED";
}

export const PRODUCTION_ARTIFACTS_DRAFT_LOCK =
  "Activate the batch first. QR codes and labels are production artifacts and are not issued on DRAFT.";
