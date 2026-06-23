import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
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
  ChevronDown,
  ChevronUp,
  Phone,
  Package,
  FlaskConical,
  ShieldCheck,
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
  ACTIVE: "#16a34a",
  SHIPPED: "#2563eb",
  IN_SERVICE: "#0891b2",
  RECALLED: "#dc2626",
  RECYCLED: "#059669",
  END_OF_LIFE: "#d97706",
};

const ACTION_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: typeof Zap }
> = {
  ACTIVATE: { label: "Activate", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: Zap },
  SHIP: { label: "Ship", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: Truck },
  INSTALL: { label: "Install", color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc", icon: Zap },
  RECYCLE: { label: "Recycle", color: "#059669", bg: "#f0fdf4", border: "#bbf7d0", icon: RotateCcw },
  CLOSE: { label: "Close", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", icon: AlertTriangle },
  RECALL: { label: "Recall", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: AlertTriangle },
};

export default function PassportDetailScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const [offlineData, setOfflineData] = useState<Passport | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

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
    onError: async (_err: unknown, action: TransitionAction) => {
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
    const config = ACTION_CONFIG[action];
    Alert.alert(
      config?.label || action,
      `Confirm ${config?.label?.toLowerCase() || action} for passport ${displayPassport?.serial_number}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "default",
          onPress: () => transitionMutation.mutate(action),
        },
      ]
    );
  }

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function dialNumber(phone: string) {
    Linking.openURL(`tel:${phone}`);
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
        <WifiOff size={56} color="#dc2626" />
        <Text style={styles.errorText}>Failed to load passport.</Text>
        <Text style={styles.errorSub}>No cached data available.</Text>
      </View>
    );
  }

  if (!displayPassport) return null;

  const p = displayPassport;
  const isOffline = !!offlineData && !passport;
  const specs = p.batch_snapshot?.specs as Record<string, unknown> | undefined;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ChevronLeft size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Passport</Text>
        <View style={{ width: 28 }} />
      </View>

      {isOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={16} color="#b45309" />
          <Text style={styles.offlineText}>Working Offline — cached data</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <Battery size={40} color={STATUS_COLORS[p.status] || "#6b7280"} />
          <Text style={[styles.statusText, { color: STATUS_COLORS[p.status] || "#6b7280" }]}>
            {p.status}
          </Text>
          <Text style={styles.serial}>{p.serial_number}</Text>
        </View>

        {/* Telemetry Grid */}
        <View style={styles.grid}>
          <InfoItem icon={<Zap size={22} color="#0ea5e9" />} label="Cycles" value={p.cycle_count?.toString() || "—"} />
          <InfoItem icon={<Thermometer size={22} color="#dc2626" />} label="Temp" value={p.last_temperature ? `${p.last_temperature}°C` : "—"} />
          <InfoItem icon={<Gauge size={22} color="#16a34a" />} label="SOH" value={p.state_of_health ? `${p.state_of_health}%` : "—"} />
          <InfoItem icon={<Zap size={22} color="#d97706" />} label="Voltage" value={p.last_voltage ? `${p.last_voltage}V` : "—"} />
        </View>

        {/* Batch Specs Accordion */}
        {specs && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("specs")}>
              <View style={styles.sectionHeaderLeft}>
                <Package size={20} color="#111827" />
                <Text style={styles.sectionTitle}>Batch Specifications</Text>
              </View>
              {expandedSections["specs"] ? (
                <ChevronUp size={20} color="#6b7280" />
              ) : (
                <ChevronDown size={20} color="#6b7280" />
              )}
            </TouchableOpacity>
            {expandedSections["specs"] && (
              <View style={styles.accordionBody}>
                <SpecRow label="Chemistry" value={specs.chemistry as string} />
                <SpecRow label="Voltage" value={specs.voltage as string} />
                <SpecRow label="Capacity" value={specs.capacity as string} />
                <SpecRow label="Weight" value={specs.weight as string} />
                <SpecRow label="Manufacturer" value={specs.manufacturer as string} />
                <SpecRow label="Carbon Footprint" value={specs.carbon_footprint as string} />
                <SpecRow label="Country" value={specs.country_of_origin as string} />
                {specs.material_composition && (
                  <TouchableOpacity
                    style={styles.nestedAccordion}
                    onPress={() => toggleSection("material")}
                  >
                    <FlaskConical size={16} color="#6b7280" />
                    <Text style={styles.nestedTitle}>Material Composition</Text>
                    {expandedSections["material"] ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
                  </TouchableOpacity>
                )}
                {expandedSections["material"] && specs.material_composition && (
                  <View style={styles.nestedBody}>
                    {Object.entries(specs.material_composition as Record<string, number>).map(([k, v]) => (
                      <Text key={k} style={styles.nestedText}>{k}: {v}%</Text>
                    ))}
                  </View>
                )}
                {specs.certifications && (
                  <View style={styles.certRow}>
                    <ShieldCheck size={16} color="#16a34a" />
                    <Text style={styles.certText}>
                      {(specs.certifications as string[]).join(", ")}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Manufacturer Contact */}
        {specs?.manufacturer_email && (
          <TouchableOpacity style={styles.contactCard} onPress={() => dialNumber(specs.manufacturer_email as string)}>
            <Phone size={20} color="#0ea5e9" />
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Manufacturer Contact</Text>
              <Text style={styles.contactValue}>{specs.manufacturer_email as string}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Allowed Actions */}
        {allowedActions && allowedActions.allowed_actions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lifecycle Actions</Text>
            <View style={styles.actionsGrid}>
              {allowedActions.allowed_actions.map((action) => {
                const config = ACTION_CONFIG[action];
                const Icon = config?.icon || Zap;
                return (
                  <TouchableOpacity
                    key={action}
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: config?.bg || "#f0f9ff",
                        borderColor: config?.border || "#bae6fd",
                      },
                    ]}
                    onPress={() => handleTransition(action)}
                    disabled={transitionMutation.isPending}
                  >
                    <Icon size={28} color={config?.color || "#0ea5e9"} />
                    <Text style={[styles.actionText, { color: config?.color || "#0ea5e9" }]}>
                      {config?.label || action}
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
          <MetaRow label="UUID" value={p.uuid} />
          <MetaRow label="Batch" value={p.batch_id} />
          <MetaRow label="Manufactured" value={new Date(p.manufacture_date).toLocaleDateString()} />
          {p.last_telemetry_at && (
            <MetaRow label="Last Telemetry" value={new Date(p.last_telemetry_at).toLocaleString()} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      {icon}
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

function SpecRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  back: {
    padding: 4,
    minWidth: 36,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fef3c7",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#fde68a",
  },
  offlineText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#92400e",
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
    fontSize: 17,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#dc2626",
  },
  errorSub: {
    fontSize: 15,
    color: "#9ca3af",
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  statusText: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 10,
  },
  serial: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 6,
    fontWeight: "500",
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
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
    fontWeight: "500",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  accordionBody: {
    marginTop: 12,
    gap: 8,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  specLabel: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },
  specValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
  },
  nestedAccordion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    marginTop: 4,
  },
  nestedTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  nestedBody: {
    paddingLeft: 28,
    gap: 4,
  },
  nestedText: {
    fontSize: 14,
    color: "#6b7280",
  },
  certRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    padding: 10,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
  },
  certText: {
    fontSize: 14,
    color: "#166534",
    fontWeight: "500",
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  contactLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  contactValue: {
    fontSize: 16,
    color: "#0ea5e9",
    fontWeight: "600",
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    width: "30%",
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 2,
    minHeight: 90,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  metaLabel: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },
  metaValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    maxWidth: "60%",
  },
});
