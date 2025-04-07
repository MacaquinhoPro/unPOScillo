// app/caja/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons'; // Asegúrate de tener esta dependencia instalada

export default function CajaLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // oculta el header nativo
      }}
    >
      {/*
        Tab de "menu".
        - routeName: "menu"
        - Se mostrará con el título "Menú" en la barra
      */}
      <Tabs.Screen
        name="menu"
        options={{
          title: "Menú",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="restaurant-outline" color={color} size={size} />
          ),
        }}
      />

      {/*
        Tab de "pagar".
        - routeName: "pagar"
        - Se mostrará con el título "Pagar" en la barra
      */}
      <Tabs.Screen
        name="pagar"
        options={{
          title: "Pagar",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="cash-outline" color={color} size={size} />
          ),
        }}
      />

      {/*
        Tab de "cerrar sesión".
        - routeName: "logout"
        - Se mostrará con el título "Cerrar Sesión" en la barra
      */}
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