import api from "@/lib/api";

export interface TallySyncConfig {
  tenant_id?: string;
  tally_host: string;
  tally_port: number;
  sync_frequency_minutes: number;
  auto_import: boolean;
  enabled: boolean;
}

export interface TallySyncConfigResponse {
  config: TallySyncConfig | null;
  enabled: boolean;
}

export interface TallySyncStagingItem {
  id: string;
  tenant_id: string;
  sync_run_id?: string;
  source_type: string;
  tally_name: string;
  tally_parent?: string;
  tally_qty?: number;
  tally_rate?: number;
  tally_amount?: number;
  tally_gst?: number;
  tally_hsn?: string;
  tally_party?: string;
  detected_category?: string;
  detected_chemistry?: string;
  status: "pending" | "applied" | "discarded";
  applied_batch_id?: string;
  applied_at?: string;
  discarded_at?: string;
  created_at: string;
}

export interface TallyStagingListResponse {
  items: TallySyncStagingItem[];
  total: number;
  limit: number;
  offset: number;
}

export async function getTallySyncConfig(): Promise<TallySyncConfigResponse> {
  const response = await api.get("/integrations/tally/sync-config");
  return response.data;
}

export async function saveTallySyncConfig(
  config: Partial<TallySyncConfig>,
): Promise<TallySyncConfig> {
  const response = await api.post("/integrations/tally/sync-config", config);
  return response.data;
}

export async function getTallyStaging(
  status: string = "pending",
  limit = 20,
  offset = 0,
): Promise<TallyStagingListResponse> {
  const response = await api.get("/integrations/tally/staging", {
    params: { status, limit, offset },
  });
  return response.data;
}

export async function applyTallyStaging(id: string): Promise<void> {
  await api.post(`/integrations/tally/staging/${id}/apply`);
}

export async function discardTallyStaging(id: string): Promise<void> {
  await api.post(`/integrations/tally/staging/${id}/discard`);
}

export async function triggerTallySync(): Promise<void> {
  await api.post("/integrations/tally/sync-trigger");
}
