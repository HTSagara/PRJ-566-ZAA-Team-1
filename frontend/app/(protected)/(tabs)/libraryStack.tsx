// app/(protected)/(tabs)/libraryStack.tsx
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LibraryScreen from "./library";
import BookReader from "./bookReader";
import BookDetailsScreen from "./bookdetails";

const Stack = createStackNavigator();

export default function LibraryStack() {
  return (
    <Stack.Navigator>
      {/* Main Library Screen */}
      <Stack.Screen
        name="Library"
        component={LibraryScreen}
        options={{ headerShown: false }}
      />
      {/* Book Details Screen */}
      <Stack.Screen
        name="bookdetails"
        component={BookDetailsScreen}
        options={{ title: "Book Details" }}
      />
      {/* Book Reader Screen */}
      <Stack.Screen
        name="bookReader"
        component={BookReader}
        options={{ title: "Book Reader" }}
      />
    </Stack.Navigator>
  );
}
