// app/cocinero/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function CocineroLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // oculta la barra superior nativa
      }}
    >
      {/* Pantalla "pedidos" (donde el cocinero ve las órdenes) */}
      <Tabs.Screen
        name="pedidos"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Pantalla de "logout" para cerrar sesión */}
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
