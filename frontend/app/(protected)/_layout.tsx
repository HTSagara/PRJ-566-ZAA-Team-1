import { useState, useEffect } from 'react';
import { Redirect } from 'expo-router';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";

import { User, getUser } from '@/utilities/auth';
import { TabBarIcon } from "@/components/navigation/TabBarIcon";

export default function DrawerLayout() {

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function init() {
      const user = await getUser();
      if (!user) {
        console.info('No user was found');
        return;
      }
      setUser(user);
      // Log the user info for debugging purposes
      console.log({ user }, 'User Info');
    }

    init();
  }, []);

  if (!user) {
    return <Redirect href="/" />;
  }

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
