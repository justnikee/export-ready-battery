/** Warehouse scan parse: UUID (raw or inside a /p/{uuid} URL) or BPAN V2 serial. */

export type DispatchScan =
  | { kind: "uuid"; uuid: string }
  | { kind: "bpan"; serial: string }
  | { kind: "invalid" };

const UUID_RE =
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;

const BPAN_RE = /^[A-Z]{2}-[A-Z0-9]+-[A-Z0-9]+-\d{4}-\d+$/i;

export function parseDispatchScan(raw: string): DispatchScan {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "invalid" };

  const uuidMatch = trimmed.match(UUID_RE);
  if (uuidMatch) {
    return { kind: "uuid", uuid: uuidMatch[0] };
  }

  const serial = trimmed.toUpperCase();
  if (BPAN_RE.test(serial)) {
    return { kind: "bpan", serial };
  }

  return { kind: "invalid" };
}

/** Units that failed ACTIVATE because they were already ACTIVE should still SHIP. */
export function shouldShipAfterActivateFailure(error: string | undefined): boolean {
  if (!error) return false;
  return /from ACTIVE\b/i.test(error) || /already ACTIVE/i.test(error);
}
