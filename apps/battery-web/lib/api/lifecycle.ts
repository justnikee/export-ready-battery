import api from '../api';

export async function resolvePassport(q: string): Promise<{
  uuid: string;
  serial_number: string;
  status: string;
}> {
  const response = await api.get("/passports/resolve", { params: { q } });
  return response.data;
}

export interface SoHHistoryEntry {
  id: string;
  passport_id: string;
  state_of_health: number;
  recorded_at: string;
  actor: string;
  actor_type: string;
  source: string;
}

export const getSoHHistory = async (
  passportUuid: string
): Promise<{ passport_id: string; history: SoHHistoryEntry[]; count: number }> => {
  const response = await api.get(`/passports/${passportUuid}/soh/history`);
  return response.data;
};

export function parseSoHPercent(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n;
}

export async function updateStateOfHealth(
  passportUuid: string,
  soh: number,
): Promise<{ success: boolean; passport_id: string; state_of_health: number }> {
  const response = await api.post(`/passports/${passportUuid}/soh`, {
    state_of_health: soh,
  });
  return response.data;
}
