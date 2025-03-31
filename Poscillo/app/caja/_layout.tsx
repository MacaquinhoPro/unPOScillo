// app/caja/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";

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
        }}
      />
    </Tabs>
  );
}
