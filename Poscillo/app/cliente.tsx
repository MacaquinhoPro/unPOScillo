// app/cliente.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import MenuScreen from "./caja/menu";

export default function ClienteScreen() {
  return (
    <View style={styles.container}>
      {/* 
        Se muestra el menú con el rol "cliente", 
        sin opción de editar ni de eliminar platos 
      */}
      <MenuScreen role="cliente" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
