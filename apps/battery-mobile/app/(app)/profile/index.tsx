import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { User, LogOut, Mail, Building2 } from "lucide-react-native";
import { useAuth } from "@/lib/auth-context";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <User size={24} color="#111827" />
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <User size={32} color="#0ea5e9" />
        </View>
        <Text style={styles.name}>{user?.name || "User"}</Text>
        <View style={styles.row}>
          <Mail size={14} color="#6b7280" />
          <Text style={styles.meta}>{user?.email}</Text>
        </View>
        {user?.tenant_id && (
          <View style={styles.row}>
            <Building2 size={14} color="#6b7280" />
            <Text style={styles.meta}>Tenant: {user.tenant_id.slice(0, 8)}...</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <LogOut size={18} color="#ef4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>AnvayaLabs Battery Mobile v1.0.0</Text>
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
  },
  card: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  meta: {
    fontSize: 13,
    color: "#6b7280",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#ef4444",
  },
  version: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 12,
    color: "#9ca3af",
  },
});
