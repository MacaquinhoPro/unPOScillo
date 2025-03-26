// app/pagar.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function PagarScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pagar</Text>
      <Text>Aquí se muestra la cuenta y el total a pagar.</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 24, marginBottom: 16 },
  button: { backgroundColor: "#9b59b6", padding: 12, borderRadius: 8, marginTop: 16 },
  buttonText: { color: "#fff" },
});
