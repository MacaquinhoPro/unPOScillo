// app/cliente.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import MenuScreen from "../caja/menu";

export default function ClienteScreen() {
  return (
    <View style={styles.container}>

      <MenuScreen role="cliente" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
