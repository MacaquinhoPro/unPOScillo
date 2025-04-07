// app/cliente/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons'; // Asegúrate de tener esta dependencia instalada

export default function ClienteLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Oculta el header nativo
      }}
    >
      {/* Tab de "Menú" */}
      <Tabs.Screen
        name="menu"
        options={{
          title: "Menú",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="restaurant-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Tab de "Pagar" */}
      <Tabs.Screen
        name="pagar"
        options={{
          title: "Pagar",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="cart-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Tab de "Cerrar Sesión" */}
      <Tabs.Screen
        name="logout"
        options={{
          title: "Cerrar Sesión",
          tabBarIcon:({ color, size }: { color: string; size: number }) => (
            <Ionicons name="exit-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}