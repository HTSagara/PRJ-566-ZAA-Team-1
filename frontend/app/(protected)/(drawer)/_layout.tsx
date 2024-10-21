import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";

export default function DrawerLayout() {
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
                name={focused ? "book" : "book-outline"}
                color={color}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="user"
          options={{
            drawerLabel: "Profile",
            title: "WordVision",
            drawerIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "person" : "person-outline"}
                color={color}
              />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
