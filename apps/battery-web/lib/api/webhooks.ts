import api from "@/lib/api";

export interface OutboundWebhook {
  id: string;
  tenant_id: string;
  url: string;
  event_types: string[];
  is_active: boolean;
  failure_count: number;
  last_triggered_at?: string;
  created_at: string;
}

export interface CreateWebhookResponse extends OutboundWebhook {
  secret: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  response_status?: number;
  response_body?: string;
  delivered_at?: string;
  retry_count: number;
  error_message?: string;
  created_at: string;
}

// The only events actually dispatched today — lifecycle transitions
// (single or bulk). Keep this in sync with TransitionAction in
// services/battery-api/internal/models/models.go; SoH updates and
// ownership transfers don't dispatch webhooks yet.
export const WEBHOOK_EVENT_OPTIONS = [
  "lifecycle.ACTIVATE",
  "lifecycle.SHIP",
  "lifecycle.INSTALL",
  "lifecycle.RECALL",
  "lifecycle.RECYCLE",
  "lifecycle.REMANUFACTURE",
  "lifecycle.REUSE",
  "lifecycle.REPURPOSE",
  "lifecycle.CLOSE",
];

export async function listWebhooks(): Promise<OutboundWebhook[]> {
  const response = await api.get("/outbound-webhooks");
  return response.data.webhooks || [];
}

export async function createWebhook(
  url: string,
  eventTypes: string[],
): Promise<CreateWebhookResponse> {
  const response = await api.post("/outbound-webhooks", {
    url,
    event_types: eventTypes,
  });
  return response.data.webhook;
}

export async function deleteWebhook(id: string): Promise<void> {
  await api.delete(`/outbound-webhooks/${id}`);
}

export async function getWebhookDeliveries(webhookId: string): Promise<WebhookDelivery[]> {
  const response = await api.get(`/webhooks/${webhookId}/deliveries`);
  return response.data.deliveries || [];
}

export async function retryWebhookDelivery(deliveryId: string): Promise<WebhookDelivery> {
  const response = await api.post(`/webhooks/deliveries/${deliveryId}/retry`, {});
  return response.data.delivery;
}
