/**
 * Partner + dashboard evidence fields. Keys must stay in lockstep with
 * services/battery-api/internal/models/evidence.go (ValidateEvidence).
 * Extra keys are rejected by the API; missing required keys fail the transition.
 */

export type EvidenceFieldType = "text" | "date";

export interface EvidenceFieldSpec {
  key: string;
  label: string;
  type: EvidenceFieldType;
  placeholder?: string;
}

export const LIFECYCLE_EVIDENCE_FIELDS: Record<string, EvidenceFieldSpec[]> = {
  SHIP: [
    {
      key: "shipment_reference",
      label: "Shipment Reference",
      type: "text",
      placeholder: "Tracking number / AWB",
    },
    { key: "shipment_date", label: "Shipment Date", type: "date" },
  ],
  INSTALL: [
    { key: "installation_date", label: "Installation Date", type: "date" },
    {
      key: "installer_id",
      label: "Installer ID",
      type: "text",
      placeholder: "Technician ID or badge",
    },
  ],
  RECYCLE: [
    {
      key: "recycler_epr_id",
      label: "Recycler EPR ID",
      type: "text",
      placeholder: "EPR-XXXX",
    },
    { key: "recycling_date", label: "Recycling Date", type: "date" },
    {
      key: "certificate_reference",
      label: "Certificate Reference",
      type: "text",
      placeholder: "Certificate number",
    },
  ],
  RECALL: [
    { key: "recall_reason", label: "Recall Reason", type: "text", placeholder: "Recall reason" },
    {
      key: "recall_reference",
      label: "Recall Reference",
      type: "text",
      placeholder: "Incident / reference ID",
    },
  ],
  CLOSE: [
    {
      key: "certificate_reference",
      label: "Certificate Reference",
      type: "text",
      placeholder: "Certificate number from recycling",
    },
  ],
  REMANUFACTURE: [
    { key: "recycler_epr_id", label: "Recycler EPR ID", type: "text", placeholder: "EPR-XXXX" },
    {
      key: "certificate_reference",
      label: "Certificate Reference",
      type: "text",
      placeholder: "Certificate number",
    },
  ],
  REUSE: [
    { key: "recycler_epr_id", label: "Recycler EPR ID", type: "text", placeholder: "EPR-XXXX" },
    {
      key: "certificate_reference",
      label: "Certificate Reference",
      type: "text",
      placeholder: "Certificate number",
    },
  ],
  REPURPOSE: [
    { key: "recycler_epr_id", label: "Recycler EPR ID", type: "text", placeholder: "EPR-XXXX" },
    {
      key: "certificate_reference",
      label: "Certificate Reference",
      type: "text",
      placeholder: "Certificate number",
    },
  ],
};

export function evidenceFieldsForAction(
  action: string,
  serverKeys?: string[],
): EvidenceFieldSpec[] {
  const local = LIFECYCLE_EVIDENCE_FIELDS[action] ?? [];
  if (!serverKeys || serverKeys.length === 0) {
    return local;
  }
  const byKey = new Map(local.map((field) => [field.key, field]));
  return serverKeys.map(
    (key) =>
      byKey.get(key) ?? {
        key,
        label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        type: key.includes("date") ? "date" : "text",
      },
  );
}

/** Only required keys, trimmed. Empty object (not undefined) for actions with no evidence. */
export function buildEvidencePayload(
  action: string,
  values: Record<string, string>,
  serverKeys?: string[],
): { evidence: Record<string, string>; missing: string[] } {
  const fields = evidenceFieldsForAction(action, serverKeys);
  const evidence: Record<string, string> = {};
  const missing: string[] = [];
  for (const field of fields) {
    const value = (values[field.key] ?? "").trim();
    if (!value) {
      missing.push(field.label);
      continue;
    }
    evidence[field.key] = value;
  }
  return { evidence, missing };
}
