// app/(protected)/(tabs)/libraryStack.tsx
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LibraryScreen from "./library"; // Assuming library.tsx is in the same folder
import BookReader from "./bookReader"; // Assuming bookReader.tsx is in the same folder

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
      {/* Detailed BookReader Screen */}
      <Stack.Screen
        name="bookReader"
        component={BookReader}
        options={{ title: "Book Reader" }}
      />
    </Stack.Navigator>
  );
}
