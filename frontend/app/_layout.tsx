import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function DrawerLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer>
        <Drawer.Screen
          name="(tabs)"
          options={{
            drawerLabel: "Home",
            title: "WordVision",
            drawerIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "home" : "home-outline"}
                color={color}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="logout"
          options={{
            drawerLabel: "Log out",
            title: "Log out",
            drawerIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "log-out" : "log-out-outline"}
                color={color}
              />
            ),
          }}
        />
        {/* Hide unwanted tabs from the drawer */}
        <Drawer.Screen
          name="+not-found"
          options={{
            drawerLabel: "",
            drawerItemStyle: { display: "none" },
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
