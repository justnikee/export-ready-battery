import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

export async function scheduleScanNotification(serialNumber: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Passport Scanned",
      body: `Serial: ${serialNumber}`,
      sound: "default",
    },
    trigger: null,
  });
}

export async function scheduleSyncNotification(
  syncedCount: number,
  failedCount: number
) {
  if (syncedCount > 0 && failedCount === 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Sync Complete",
        body: `${syncedCount} action${syncedCount > 1 ? "s" : ""} synced successfully`,
        sound: "default",
      },
      trigger: null,
    });
  } else if (failedCount > 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Sync Issues",
        body: `${syncedCount} synced, ${failedCount} failed — tap to review`,
        sound: "default",
      },
      trigger: null,
    });
  }
}

export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}

export async function cancelAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}
