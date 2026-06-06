import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "@/lib/auth-context";
import {
  isBiometricAvailable,
  isBiometricEnabled,
  enableBiometric,
  authenticateWithBiometric,
} from "@/lib/biometric";
import { Battery, Fingerprint } from "lucide-react-native";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioPrompt, setBioPrompt] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, []);

  async function checkBiometric() {
    const available = await isBiometricAvailable();
    setBioAvailable(available);
    if (available) {
      const enabled = await isBiometricEnabled();
      setBioEnabled(enabled);
      if (enabled) {
        // Try biometric login immediately
        const success = await authenticateWithBiometric();
        if (success) {
          // Biometric passed but we still need the token from SecureStore
          // The auth context restoreSession will handle it
          setBioPrompt(true);
        }
      }
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      if (bioAvailable && !bioEnabled) {
        setBioPrompt(true);
      }
    } catch {
      setError("Invalid credentials or network error");
    } finally {
      setLoading(false);
    }
  }

  async function enableBio() {
    await enableBiometric();
    setBioEnabled(true);
    setBioPrompt(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Battery size={56} color="#0ea5e9" />
          <Text style={styles.title}>AnvayaLabs</Text>
          <Text style={styles.subtitle}>Battery Passport Mobile</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          {bioAvailable && (
            <TouchableOpacity
              style={styles.bioButton}
              onPress={async () => {
                const success = await authenticateWithBiometric();
                if (success) {
                  setBioPrompt(true);
                }
              }}
            >
              <Fingerprint size={22} color="#0ea5e9" />
              <Text style={styles.bioText}>Use Face ID / Fingerprint</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Biometric enable prompt */}
        {bioPrompt && !bioEnabled && (
          <View style={styles.bioPrompt}>
            <Fingerprint size={28} color="#0ea5e9" />
            <Text style={styles.bioPromptTitle}>Enable faster login?</Text>
            <Text style={styles.bioPromptText}>
              Use Face ID or fingerprint next time instead of typing your password.
            </Text>
            <View style={styles.bioPromptActions}>
              <TouchableOpacity style={styles.bioPromptSecondary} onPress={() => setBioPrompt(false)}>
                <Text style={styles.bioPromptSecondaryText}>Not Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bioPromptPrimary} onPress={enableBio}>
                <Text style={styles.bioPromptPrimaryText}>Enable</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 16,
    color: "#111827",
  },
  subtitle: {
    fontSize: 17,
    color: "#6b7280",
    marginTop: 6,
  },
  form: {
    gap: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 17,
    color: "#111827",
    backgroundColor: "#f9fafb",
    minHeight: 52,
  },
  button: {
    backgroundColor: "#0ea5e9",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 6,
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  bioButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bae6fd",
    backgroundColor: "#f0f9ff",
    minHeight: 52,
  },
  bioText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0369a1",
  },
  error: {
    color: "#dc2626",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 4,
  },
  bioPrompt: {
    marginTop: 24,
    padding: 20,
    backgroundColor: "#f0f9ff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#bae6fd",
    alignItems: "center",
    gap: 10,
  },
  bioPromptTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  bioPromptText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  bioPromptActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  bioPromptPrimary: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  bioPromptPrimaryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  bioPromptSecondary: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  bioPromptSecondaryText: {
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "500",
  },
});
