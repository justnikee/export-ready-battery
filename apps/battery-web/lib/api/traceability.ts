import api from "@/lib/api";
import { prepareSupplierCache } from "@/lib/supplier-cache";

export type TracePack = {
  id: string;
  serial_number: string;
  batch_id: string;
  batch_name: string;
  batch_status: string;
};

export type TraceLot = {
  id: string;
  source: string;
  part_number: string;
  lot_code: string;
};

export type TraceEvidence = {
  scope: "pack" | "batch_all" | "batch_unknown";
  file_name: string;
  source_row: number;
  recorded_at: string;
};

export type TracePage<T> = { items: T[]; has_more: boolean };
export type TracePackDetail = { pack: TracePack; lots: TracePage<{ lot: TraceLot; evidence: TraceEvidence }> };
export type TraceLotDetail = {
  lot: TraceLot;
  impact: TracePage<{
    pack_id: string | null;
    serial_number: string | null;
    batch_id: string;
    batch_name: string;
    batch_status: string;
    evidence: TraceEvidence;
  }>;
};

export const tracePageSize = 25;

async function readTraceability<T>(path: string, page: number, signal: AbortSignal, search: Record<string, string> = {}) {
  await prepareSupplierCache();
  const { data } = await api.get<T>(`/traceability/${path}`, {
    params: { ...search, limit: tracePageSize, offset: page * tracePageSize },
    signal,
  });
  return data;
}

export function findTracePacks(serial: string, page: number, signal: AbortSignal) {
  return readTraceability<TracePage<TracePack>>("packs", page, signal, { serial });
}

export function findTraceLots(code: string, page: number, signal: AbortSignal) {
  return readTraceability<TracePage<TraceLot>>("lots", page, signal, { code });
}

export function getTracePack(id: string, page: number, signal: AbortSignal) {
  return readTraceability<TracePackDetail>(`packs/${encodeURIComponent(id)}`, page, signal);
}

export function getTraceLot(id: string, page: number, signal: AbortSignal) {
  return readTraceability<TraceLotDetail>(`lots/${encodeURIComponent(id)}`, page, signal);
}
