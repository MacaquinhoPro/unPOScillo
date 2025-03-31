// app/caja.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import MenuScreen from "./menu";

export default function CajaScreen() {
  return (
    <View style={styles.container}>
      {/* 
        Se muestra el menú con el rol "caja", lo que habilita
        la funcionalidad de añadir y eliminar platos
      */}
      <MenuScreen role="caja" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
