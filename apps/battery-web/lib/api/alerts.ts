import api from "@/lib/api";
import type { TenantAlert } from "@/lib/types";

export interface AlertsResponse {
  alerts: TenantAlert[];
}

export interface UnreadAlertsResponse {
  alerts: TenantAlert[];
  count: number;
}

export interface UnreadCountResponse {
  count: number;
}

export async function getAlerts(limit = 50, offset = 0): Promise<TenantAlert[]> {
  const response = await api.get<AlertsResponse>(
    `/alerts?limit=${limit}&offset=${offset}`,
  );
  return response.data.alerts;
}

export async function getUnreadAlerts(limit = 20): Promise<UnreadAlertsResponse> {
  const response = await api.get<UnreadAlertsResponse>(
    `/alerts/unread?limit=${limit}`,
  );
  return response.data;
}

export async function getUnreadAlertCount(): Promise<number> {
  const response = await api.get<UnreadCountResponse>("/alerts/unread-count");
  return response.data.count;
}

export async function markAlertRead(alertId: string): Promise<void> {
  await api.post(`/alerts/${alertId}/read`, {});
}
