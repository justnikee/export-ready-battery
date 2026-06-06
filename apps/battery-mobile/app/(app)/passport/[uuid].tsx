import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Battery,
  Thermometer,
  Gauge,
  Zap,
  Truck,
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  WifiOff,
} from "lucide-react-native";
import api from "@/lib/api";
import {
  getScannedPassport,
  insertScannedPassport,
  insertPendingAction,
} from "@/lib/db";
import type { Passport, TransitionResult, TransitionAction } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  CREATED: "#6b7280",
  ACTIVE: "#22c55e",
  SHIPPED: "#3b82f6",
  IN_SERVICE: "#0ea5e9",
  RECALLED: "#ef4444",
  RECYCLED: "#10b981",
  END_OF_LIFE: "#f59e0b",
};

const ACTION_LABELS: Record<string, string> = {
  ACTIVATE: "Activate",
  SHIP: "Ship",
  INSTALL: "Install",
  RECYCLE: "Recycle",
  CLOSE: "Close",
  RECALL: "Recall",
};

const ACTION_ICONS: Record<string, typeof Zap> = {
  ACTIVATE: Zap,
  SHIP: Truck,
  INSTALL: Zap,
  RECYCLE: RotateCcw,
  CLOSE: AlertTriangle,
  RECALL: AlertTriangle,
};

export default function PassportDetailScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const [offlineData, setOfflineData] = useState<Passport | null>(null);

  useQuery({
    queryKey: ["passport-cache", uuid],
    queryFn: async () => {
      const cached = await getScannedPassport(uuid);
      if (cached) setOfflineData(cached);
      return cached;
    },
    staleTime: Infinity,
  });

  const { data: passport, isLoading, error } = useQuery({
    queryKey: ["passport", uuid],
    queryFn: async () => {
      const response = await api.get(`/passports/${uuid}`);
      const p = response.data as Passport;
      await insertScannedPassport(p);
      setOfflineData(null);
      return p;
    },
  });

  const { data: allowedActions } = useQuery({
    queryKey: ["passport-actions", uuid],
    queryFn: async () => {
      const response = await api.get(`/passports/${uuid}/transitions`);
      return response.data as { allowed_actions: TransitionAction[] };
    },
    enabled: !!passport,
  });

  const transitionMutation = useMutation({
    mutationFn: async (action: TransitionAction) => {
      const response = await api.post(`/passports/${uuid}/transition`, {
        action,
      });
      return response.data as TransitionResult;
    },
    onSuccess: () => {
      Alert.alert("Success", "Transition completed successfully");
    },
    onError: async (err, action) => {
      // Queue for offline retry
      await insertPendingAction({
        id: `${Date.now()}`,
        type: "lifecycle_transition",
        payload: JSON.stringify({ passport_uuid: uuid, action }),
        status: "pending",
        retry_count: 0,
        created_at: Date.now(),
      });
      Alert.alert(
        "Queued Offline",
        "No connectivity — action saved and will sync automatically."
      );
    },
  });

  function handleTransition(action: TransitionAction) {
    Alert.alert(
      ACTION_LABELS[action] || action,
      `Are you sure you want to ${ACTION_LABELS[action]?.toLowerCase() || action} this passport?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => transitionMutation.mutate(action),
        },
      ]
    );
  }

  const displayPassport = passport || offlineData;

  if (isLoading && !displayPassport) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading passport...</Text>
      </View>
    );
  }

  if (error && !displayPassport) {
    return (
      <View style={styles.center}>
        <WifiOff size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load passport.</Text>
        <Text style={styles.errorSub}>No cached data available.</Text>
      </View>
    );
  }

  if (!displayPassport) return null;

  const p = displayPassport;
  const isOffline = !!offlineData && !passport;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Passport</Text>
        <View style={{ width: 24 }} />
      </View>

      {isOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={14} color="#f59e0b" />
          <Text style={styles.offlineText}>Offline — showing cached data</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <Battery size={32} color={STATUS_COLORS[p.status] || "#6b7280"} />
          <Text style={[styles.statusText, { color: STATUS_COLORS[p.status] || "#6b7280" }]}>
            {p.status}
          </Text>
          <Text style={styles.serial}>{p.serial_number}</Text>
        </View>

        {/* Info Grid */}
        <View style={styles.grid}>
          <InfoItem icon={<Zap size={18} color="#0ea5e9" />} label="Cycles" value={p.cycle_count?.toString() || "-"} />
          <InfoItem icon={<Thermometer size={18} color="#ef4444" />} label="Temp" value={p.last_temperature ? `${p.last_temperature}°C` : "-"} />
          <InfoItem icon={<Gauge size={18} color="#22c55e" />} label="SOH" value={p.state_of_health ? `${p.state_of_health}%` : "-"} />
          <InfoItem icon={<Zap size={18} color="#f59e0b" />} label="Voltage" value={p.last_voltage ? `${p.last_voltage}V` : "-"} />
        </View>

        {/* Batch Snapshot */}
        {p.batch_snapshot && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Batch Details</Text>
            <Text style={styles.sectionText}>
              {JSON.stringify(p.batch_snapshot, null, 2).slice(0, 500)}
            </Text>
          </View>
        )}

        {/* Allowed Actions */}
        {allowedActions && allowedActions.allowed_actions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionsGrid}>
              {allowedActions.allowed_actions.map((action) => {
                const Icon = ACTION_ICONS[action] || Zap;
                return (
                  <TouchableOpacity
                    key={action}
                    style={styles.actionButton}
                    onPress={() => handleTransition(action)}
                    disabled={transitionMutation.isPending}
                  >
                    <Icon size={20} color="#0ea5e9" />
                    <Text style={styles.actionText}>
                      {ACTION_LABELS[action] || action}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metadata</Text>
          <Text style={styles.metaText}>UUID: {p.uuid}</Text>
          <Text style={styles.metaText}>Batch: {p.batch_id}</Text>
          <Text style={styles.metaText}>
            Manufactured: {new Date(p.manufacture_date).toLocaleDateString()}
          </Text>
          {p.last_telemetry_at && (
            <Text style={styles.metaText}>
              Last Telemetry: {new Date(p.last_telemetry_at).toLocaleString()}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoItem}>
      {icon}
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  back: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fffbeb",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#fde68a",
  },
  offlineText: {
    fontSize: 13,
    color: "#b45309",
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "500",
  },
  errorSub: {
    fontSize: 14,
    color: "#9ca3af",
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statusText: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  serial: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoItem: {
    flex: 1,
    minWidth: "22%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginTop: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 13,
    color: "#6b7280",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0369a1",
  },
  metaText: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
  },
});
