import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react-native";
import {
  getPendingActions,
  updateActionStatus,
  deleteAction,
} from "@/lib/db";
import type { PendingAction } from "@/lib/types";
import api from "@/lib/api";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  pending: { label: "Pending", color: "#f59e0b", icon: WifiOff },
  synced: { label: "Synced", color: "#22c55e", icon: CheckCircle2 },
  failed: { label: "Failed", color: "#ef4444", icon: XCircle },
};

export default function ActionsScreen() {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function loadActions() {
    const list = await getPendingActions();
    setActions(list);
  }

  useFocusEffect(
    useCallback(() => {
      loadActions();
    }, [])
  );

  async function handleSync() {
    const unsynced = actions.filter((a) => a.status === "pending");
    if (unsynced.length === 0) return;

    setSyncing(true);
    for (const action of unsynced) {
      try {
        const payload = JSON.parse(action.payload);
        if (action.type === "lifecycle_transition") {
          await api.post(`/passports/${payload.passport_uuid}/transition`, {
            action: payload.action,
          });
        }
        await updateActionStatus(action.id, "synced");
      } catch {
        const newRetry = action.retry_count + 1;
        if (newRetry > 3) {
          await updateActionStatus(action.id, "failed", newRetry);
        } else {
          await updateActionStatus(action.id, "pending", newRetry);
        }
      }
    }
    setSyncing(false);
    await loadActions();
  }

  async function handleRetry(action: PendingAction) {
    try {
      const payload = JSON.parse(action.payload);
      if (action.type === "lifecycle_transition") {
        await api.post(`/passports/${payload.passport_uuid}/transition`, {
          action: payload.action,
        });
      }
      await updateActionStatus(action.id, "synced");
    } catch {
      Alert.alert("Retry Failed", "Still offline or server error.");
    }
    await loadActions();
  }

  async function handleDelete(id: string) {
    await deleteAction(id);
    await loadActions();
  }

  const pendingCount = actions.filter((a) => a.status === "pending").length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ClipboardList size={24} color="#111827" />
        <Text style={styles.headerTitle}>Pending Actions</Text>
        {pendingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>

      {pendingCount > 0 && (
        <TouchableOpacity
          style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
          onPress={handleSync}
          disabled={syncing}
        >
          <Wifi size={18} color="#fff" />
          <Text style={styles.syncButtonText}>
            {syncing ? "Syncing..." : "Sync All Now"}
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={actions}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadActions} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <CheckCircle2 size={48} color="#22c55e" />
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyText}>
              No pending actions. Lifecycle changes sync automatically.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
          const Icon = config.icon;
          const payload = JSON.parse(item.payload);

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitle}>
                  <Icon size={18} color={config.color} />
                  <Text style={styles.cardTitleText}>
                    {item.type.replace(/_/g, " ").toUpperCase()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${config.color}15` },
                  ]}
                >
                  <Text style={[styles.statusText, { color: config.color }]}>
                    {config.label}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardBody}>
                Passport: {payload.passport_uuid?.slice(0, 8)}...{"\n"}
                Action: {payload.action}{"\n"}
                Retries: {item.retry_count}
              </Text>

              <View style={styles.cardActions}>
                {item.status === "failed" && (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => handleRetry(item)}
                  >
                    <RotateCcw size={14} color="#0ea5e9" />
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                )}
                {item.status === "synced" && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id)}
                  >
                    <XCircle size={14} color="#6b7280" />
                    <Text style={styles.deleteText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  badge: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0ea5e9",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardBody: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  retryText: {
    fontSize: 13,
    color: "#0ea5e9",
    fontWeight: "500",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deleteText: {
    fontSize: 13,
    color: "#6b7280",
  },
});
