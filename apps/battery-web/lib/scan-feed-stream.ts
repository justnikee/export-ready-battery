import { getAccessToken } from "@/lib/api";

export interface ScanFeedItem {
  city: string;
  country: string;
  device_type: string;
  scanned_at: string;
  serial_number: string;
  latitude?: number;
  longitude?: number;
  batch_name: string;
}

const RECONNECT_DELAY_MS = 3000;

// Native EventSource can't send the Authorization: Bearer header this app's
// auth model relies on (no cookie session) — so this reads the SSE response
// manually via fetch(), which can. Auto-reconnects on a dropped connection
// (proxy timeout, network blip); does not reconnect after an explicit abort.
export function subscribeScanFeedStream(
  onScan: (scan: ScanFeedItem) => void,
): () => void {
  const controller = new AbortController();
  let stopped = false;

  const connect = async () => {
    const baseURL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const token = getAccessToken();

    try {
      const response = await fetch(`${baseURL}/scans/feed/stream`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(`scan feed stream returned ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!stopped) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? ""; // last chunk may be incomplete — keep it buffered

        for (const event of events) {
          for (const line of event.split("\n")) {
            if (!line.startsWith("data:")) continue;
            try {
              const scan = JSON.parse(line.slice(5).trim()) as ScanFeedItem;
              onScan(scan);
            } catch {
              // malformed event — skip rather than crash the stream
            }
          }
        }
      }
    } catch {
      if (controller.signal.aborted) return; // intentional disconnect — don't reconnect
    }

    if (!stopped) {
      setTimeout(connect, RECONNECT_DELAY_MS);
    }
  };

  connect();

  return () => {
    stopped = true;
    controller.abort();
  };
}
