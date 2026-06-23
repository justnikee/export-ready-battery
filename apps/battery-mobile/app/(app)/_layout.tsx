import { Tabs } from "expo-router";
import { Camera, ClipboardList, User } from "lucide-react-native";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0ea5e9",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <Tabs.Screen
        name="scan/index"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Camera size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="actions/index"
        options={{
          title: "Actions",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <ClipboardList size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="passport/[uuid]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
