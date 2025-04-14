// app/cocinero/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function CocineroLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, 
      }}
    >
      <Tabs.Screen
        name="pedidos"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="logout"
        options={{
          title: "Cerrar Sesión",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="exit-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
