/**
 * Shared carbon-calculator types and helpers.
 * The EU Art. 7 activation gate only accepts batch.carbon_footprint_result
 * from POST /carbon/calculate (then POST /batches/{id}/carbon). Free-text
 * specs.carbon_footprint is display-only.
 */

import api from "@/lib/api";

export interface CarbonInput {
  chemistry: string;
  capacity_kwh: number;
  cell_source_country: string;
  factory_country: string;
  assembly_energy_kwh: number;
  transport_mode: string;
  transport_distance_km: number;
  battery_weight_kg: number;
}

export interface CarbonBreakdown {
  cell_production_kg_co2e: number;
  cell_energy_kg_co2e: number;
  assembly_kg_co2e: number;
  transport_kg_co2e: number;
}

export interface CarbonFactorUsed {
  category: string;
  subcategory: string;
  value: number;
  unit: string;
  source: string;
}

export interface CarbonResult {
  total_kg_co2e: number;
  per_kwh_kg_co2e: number;
  carbon_class: string;
  breakdown: CarbonBreakdown;
  methodology: string;
  calculation_date: string;
  declaration_text: string;
  factors_used: CarbonFactorUsed[];
}

const NOMINAL_VOLTAGE_BY_CHEMISTRY: Record<string, number> = {
  LFP: 3.2,
  SODIUM: 3.1,
  "SODIUM-ION": 3.1,
  NMC_622: 3.6,
  NMC622: 3.6,
  NMC_811: 3.65,
  NMC811: 3.65,
  NMC: 3.6,
  NCA: 3.65,
  LCO: 3.7,
  LTO: 2.4,
  LMO: 3.8,
  "LI-ION": 3.6,
};

/** Parse "50 Ah" / "3.7 kWh" into kWh. Returns 0 when the string is unusable. */
export function parseCapacityKwh(raw?: string, chemistry?: string): number {
  if (!raw) return 0;
  const num = parseFloat(raw);
  if (Number.isNaN(num) || num <= 0) return 0;
  const lower = raw.toLowerCase();
  if (lower.includes("kwh")) return num;
  if (lower.includes("ah")) {
    const voltage =
      NOMINAL_VOLTAGE_BY_CHEMISTRY[chemistry?.toUpperCase() ?? ""] ?? 3.6;
    return (num * voltage) / 1000;
  }
  return num;
}

/** Parse "2500 g" / "25 kg" into kilograms. Returns 0 when unusable. */
export function parseWeightKg(raw?: string): number {
  if (!raw) return 0;
  const num = parseFloat(raw);
  if (Number.isNaN(num) || num <= 0) return 0;
  const lower = raw.toLowerCase();
  if (lower.includes("g") && !lower.includes("kg")) return num / 1000;
  return num;
}

/** Fingerprint of the specs the calculator result was computed from. */
export function carbonSpecKey(
  chemistry: string,
  capacity: string,
  weight: string,
): string {
  return `${chemistry.trim()}|${capacity.trim()}|${weight.trim()}`;
}

export function isCarbonResultPayload(
  value: unknown,
): value is CarbonResult {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.total_kg_co2e === "number" &&
    typeof record.carbon_class === "string" &&
    record.carbon_class.length > 0
  );
}

/** True when the stored calculator result still matches current specs. */
export function isCarbonResultCurrent(data: {
  carbonFootprintResult?: Record<string, unknown> | null;
  carbonResultSpecKey?: string;
  chemistry?: string;
  capacity?: string;
  weight?: string;
}): boolean {
  if (!isCarbonResultPayload(data.carbonFootprintResult)) return false;
  if (!data.carbonResultSpecKey) return false;
  return (
    data.carbonResultSpecKey ===
    carbonSpecKey(data.chemistry ?? "", data.capacity ?? "", data.weight ?? "")
  );
}

/** Persist a calculator result on a batch (Art. 7 source of truth). */
export async function saveCarbonToBatch(
  batchId: string,
  result: CarbonResult,
): Promise<void> {
  await api.post(`/batches/${batchId}/carbon`, result);
}
