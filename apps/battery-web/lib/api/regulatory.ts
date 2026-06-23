import api from "@/lib/api";
import type { RegulatorySource, RegulatoryItem, TenantRegulatoryAlert } from "@/lib/types";

export interface RegulatoryAlertsResponse {
  alerts: TenantRegulatoryAlert[];
  total: number;
}

export interface RegulatoryItemsResponse {
  items: RegulatoryItem[];
  total: number;
}

export interface RegulatorySourcesResponse {
  sources: RegulatorySource[];
}

export async function getRegulatoryAlertUnreadCount(): Promise<number> {
  const response = await api.get<{ count: number }>("/regulatory/alerts/unread-count");
  return response.data.count;
}

export async function getRegulatoryAlerts(unreadOnly = false, limit = 20, offset = 0): Promise<RegulatoryAlertsResponse> {
  const response = await api.get<RegulatoryAlertsResponse>(
    `/regulatory/alerts?unread_only=${unreadOnly}&limit=${limit}&offset=${offset}`,
  );
  return response.data;
}

export async function markRegulatoryAlertRead(alertId: string): Promise<void> {
  await api.post(`/regulatory/alerts/${alertId}/read`, {});
}

export async function dismissRegulatoryAlert(alertId: string): Promise<void> {
  await api.post(`/regulatory/alerts/${alertId}/dismiss`, {});
}

export async function getRegulatoryItems(filters?: {
  product_type?: string;
  market_region?: string;
  urgency?: string;
  limit?: number;
  offset?: number;
}): Promise<RegulatoryItemsResponse> {
  const params = new URLSearchParams();
  if (filters?.product_type) params.append("product_type", filters.product_type);
  if (filters?.market_region) params.append("market_region", filters.market_region);
  if (filters?.urgency) params.append("urgency", filters.urgency);
  if (filters?.limit !== undefined) params.append("limit", String(filters.limit));
  if (filters?.offset !== undefined) params.append("offset", String(filters.offset));
  const response = await api.get<RegulatoryItemsResponse>(`/regulatory/items?${params.toString()}`);
  return response.data;
}

export async function getRegulatorySources(activeOnly = false): Promise<RegulatorySourcesResponse> {
  const response = await api.get<RegulatorySourcesResponse>(`/regulatory/sources?active_only=${activeOnly}`);
  return response.data;
}

export async function forceFetchSource(sourceId: string): Promise<void> {
  await api.post(`/regulatory/sources/${sourceId}/fetch`, {});
}
