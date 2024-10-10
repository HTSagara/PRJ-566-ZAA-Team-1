import { useState, useEffect } from 'react';
import { Redirect } from 'expo-router';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";

import {
  StyleSheet,
  View,
  Text,
} from 'react-native';

import { User, getUser } from '@/utilities/auth';
import { TabBarIcon } from "@/components/navigation/TabBarIcon";

export default function DrawerLayout() {

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function init() {
      const user = await getUser();
      setUser(user);
      setLoading(false);

      if (!user) {
        console.info('No user was found');
        return;
      }
      // Log the user info for debugging purposes
      console.log({ user }, 'User Info');
    }

    init();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <Text style={styles.centerText}>Loading WordVision...</Text>
        </View>
      </View>
    );
  }

  else if (!user) {
    return <Redirect href="/" />;
  }

  else {
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

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  Logo: {
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
  headerRight: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  uploadButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    position: 'absolute',
    top: '45%',
    left: '33%',
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  centerText: {
    color: "#FFFFFF",
    fontSize: 32, // Larger text
    fontWeight: "bold",
    textAlign: 'center',
  },
});

