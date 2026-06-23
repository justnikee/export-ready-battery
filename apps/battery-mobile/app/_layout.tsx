import { useEffect, useState, useRef } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { queryClient } from "@/lib/query-client";
import { openDatabase } from "@/lib/db";
import { requestNotificationPermissions } from "@/lib/notifications";
import { watchNetwork, flushPendingActions } from "@/lib/sync";
import { View, ActivityIndicator } from "react-native";

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [dbReady, setDbReady] = useState(false);
  const networkCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    openDatabase().then(() => setDbReady(true));
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    if (!dbReady) return;
    // Watch network and auto-flush on reconnect
    networkCleanupRef.current = watchNetwork(async (isConnected) => {
      if (isConnected) {
        await flushPendingActions();
      }
    });
    return () => {
      if (networkCleanupRef.current) networkCleanupRef.current();
    };
  }, [dbReady]);

  useEffect(() => {
    // Deep linking handler
    const subscription = Linking.addEventListener("url", (event) => {
      const url = event.url;
      if (url) {
        const match = url.match(/passport\/([0-9a-f-]+)/i);
        if (match) {
          router.push(`/(app)/passport/${match[1]}`);
        }
      }
    });

    // Handle initial URL if app opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        const match = url.match(/passport\/([0-9a-f-]+)/i);
        if (match) {
          router.push(`/(app)/passport/${match[1]}`);
        }
      }
    });

    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    if (isLoading || !dbReady) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(app)/scan");
    }
  }, [user, isLoading, segments, dbReady, router]);

  if (isLoading || !dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
