import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Audio } from "expo-av";
import { QrCode, Zap, Flashlight, FlashlightOff, ZoomIn, ZoomOut, History } from "lucide-react-native";
import { getAllScannedPassports } from "@/lib/db";
import { scheduleScanNotification } from "@/lib/notifications";
import type { Passport } from "@/lib/types";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [history, setHistory] = useState<{ passport: Passport; scanned_at: number }[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const list = await getAllScannedPassports();
    setHistory(list.slice(0, 3));
  }

  const playBeep = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("@/assets/beep.mp3"),
        { volume: 0.5 }
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch {
      // Audio file missing — silent fallback
    }
  };

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanned) return;
      setScanned(true);

      Vibration.vibrate(100);
      await playBeep();

      let uuid = data.trim();
      const gs1Match = uuid.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
      );
      if (gs1Match) {
        uuid = gs1Match[0];
      }

      await scheduleScanNotification(uuid.slice(0, 8));
      await loadHistory();

      setTimeout(() => {
        router.push(`/(app)/passport/${uuid}`);
        setScanned(false);
      }, 400);
    },
    [scanned, router]
  );

  const toggleTorch = () => setTorchOn((p) => !p);
  const increaseZoom = () => setZoom((p) => Math.min(p + 0.1, 1));
  const decreaseZoom = () => setZoom((p) => Math.max(p - 0.1, 0));

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.textLarge}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <QrCode size={64} color="#9ca3af" />
        <Text style={styles.textLarge}>Camera access required</Text>
        <Text style={styles.textMuted}>We need the camera to scan battery passport QR codes.</Text>
        <TouchableOpacity style={styles.bigButton} onPress={requestPermission}>
          <Text style={styles.bigButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torchOn}
        zoom={zoom}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarCodeScanned}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top controls */}
          <View style={styles.topControls}>
            <Pressable style={styles.controlButton} onPress={toggleTorch}>
              {torchOn ? (
                <FlashlightOff size={28} color="#fff" />
              ) : (
                <Flashlight size={28} color="#fff" />
              )}
            </Pressable>
          </View>

          {/* Scan frame */}
          <View style={styles.frameContainer}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.hint}>
              <Zap size={20} color="#0ea5e9" />
              <Text style={styles.hintText}>Point at QR code</Text>
            </View>
          </View>

          {/* Zoom controls */}
          <View style={styles.zoomControls}>
            <Pressable style={styles.zoomButton} onPress={decreaseZoom}>
              <ZoomOut size={28} color="#fff" />
            </Pressable>
            <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
            <Pressable style={styles.zoomButton} onPress={increaseZoom}>
              <ZoomIn size={28} color="#fff" />
            </Pressable>
          </View>
        </View>
      </CameraView>

      {/* History */}
      {history.length > 0 && (
        <View style={styles.historyPanel}>
          <View style={styles.historyHeader}>
            <History size={20} color="#6b7280" />
            <Text style={styles.historyTitle}>Recent Scans</Text>
          </View>
          {history.map((h) => (
            <TouchableOpacity
              key={h.passport.uuid}
              style={styles.historyItem}
              onPress={() => router.push(`/(app)/passport/${h.passport.uuid}`)}
            >
              <Text style={styles.historySerial}>{h.passport.serial_number}</Text>
              <Text style={styles.historyStatus}>{h.passport.status}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "space-between",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  frameContainer: {
    alignItems: "center",
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#0ea5e9",
    borderWidth: 5,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 12,
  },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  hintText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  zoomControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  zoomButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    minWidth: 50,
    textAlign: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    padding: 24,
    backgroundColor: "#fff",
  },
  textLarge: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  textMuted: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  bigButton: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 8,
    minWidth: 200,
    alignItems: "center",
  },
  bigButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  historyPanel: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    marginBottom: 8,
  },
  historySerial: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  historyStatus: {
    fontSize: 13,
    color: "#6b7280",
  },
});
