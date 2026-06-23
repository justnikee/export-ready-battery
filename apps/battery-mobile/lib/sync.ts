import * as Network from "expo-network";
import {
  getUnsyncedActions,
  updateActionStatus,
} from "./db";
import { scheduleSyncNotification, setBadgeCount } from "./notifications";
import api from "./api";

let isSyncing = false;

export async function flushPendingActions(): Promise<{
  synced: number;
  failed: number;
}> {
  if (isSyncing) return { synced: 0, failed: 0 };
  isSyncing = true;

  const unsynced = await getUnsyncedActions();
  if (unsynced.length === 0) {
    isSyncing = false;
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const action of unsynced) {
    try {
      const payload = JSON.parse(action.payload);
      if (action.type === "lifecycle_transition") {
        await api.post(`/passports/${payload.passport_uuid}/transition`, {
          action: payload.action,
        });
      }
      await updateActionStatus(action.id, "synced");
      synced++;
    } catch {
      const newRetry = action.retry_count + 1;
      if (newRetry > 3) {
        await updateActionStatus(action.id, "failed", newRetry);
        failed++;
      } else {
        await updateActionStatus(action.id, "pending", newRetry);
      }
    }
  }

  const remainingPending = (await getUnsyncedActions()).length;
  await setBadgeCount(remainingPending);

  if (synced > 0 || failed > 0) {
    await scheduleSyncNotification(synced, failed);
  }

  isSyncing = false;
  return { synced, failed };
}

export function watchNetwork(callback: (isConnected: boolean) => void) {
  let lastState = true;

  const interval = setInterval(async () => {
    const state = await Network.getNetworkStateAsync();
    const isConnected = state.isConnected && state.isInternetReachable;

    if (isConnected && !lastState) {
      // Just came back online
      callback(true);
    }

    lastState = !!isConnected;
  }, 5000);

  return () => clearInterval(interval);
}
