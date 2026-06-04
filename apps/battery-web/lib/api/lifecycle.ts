import api from '../api';

export interface SoHHistoryEntry {
  id: string;
  passport_id: string;
  soh: number;
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
