// app/Cliente/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ClienteLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="cliente"
        options={{
          title: "Menú",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Nueva pestaña para ver el estado del pedido */}
      <Tabs.Screen
        name="pedidoStatus"
        options={{
          title: "Estado Pedido",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="timer-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="carrito"
        options={{
          title: "Carrito",
          tabBarIcon: ({ color, size }) => (
          <Ionicons name="cart-outline" size={size} color={color} />            
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