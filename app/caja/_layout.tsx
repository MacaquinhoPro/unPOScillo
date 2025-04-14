// app/caja/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function CajaLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, 
      }}
    >

      <Tabs.Screen
        name="menu"
        options={{
          title: "Menú",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="restaurant-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="cuentas"
        options={{
          title: "Cuentas",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
          <Ionicons name="receipt-outline" size={size} color={color} />          
          ),
        }}
      />

      <Tabs.Screen
        name="logout"
        options={{
          title: "Cerrar Sesión",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="exit-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}