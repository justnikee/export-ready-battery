import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_ENABLED_KEY = "biometric_enabled";

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function isBiometricEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
  return value === "true";
}

export async function enableBiometric(): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
}

export async function disableBiometric(): Promise<void> {
  await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
}

export async function authenticateWithBiometric(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Authenticate to access Battery Passport",
    fallbackLabel: "Use password",
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });
  return result.success;
}
