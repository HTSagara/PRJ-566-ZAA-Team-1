// app/(protected)/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import React from "react";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
      }}
    >
      {/* Library Tab */}
      <Tabs.Screen
        name="library"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "book" : "book-outline"}
              color={color}
            />
          ),
        }}
      />

      {/*Hidden tabs*/}
      <Tabs.Screen
        name="bookdetails"
        options={{
          tabBarButton: () => null, // Hides the tab button
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="bookReader"
        options={{
          tabBarButton: () => null, // Hides the tab button
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="libraryStack"
        options={{
          tabBarButton: () => null, // Hides the tab button
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="types"
        options={{
          tabBarButton: () => null, // Hides the tab button
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
