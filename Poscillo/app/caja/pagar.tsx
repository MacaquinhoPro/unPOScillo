// app/caja/pagar.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function PagarScreen() {
  const router = useRouter();

  const handleFinishPayment = () => {
    // Aquí pones la lógica de cobro real 
    // (por ejemplo, actualizar un estado en Firestore)
    // y redirigir a donde necesites
    router.back(); // vuelve al tab anterior o a donde prefieras
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla de Pago</Text>
      <Text style={styles.subtitle}>
        Aquí se mostraría el total a cobrar y la confirmación de pago
      </Text>
      <TouchableOpacity style={styles.payButton} onPress={handleFinishPayment}>
        <Text style={styles.payButtonText}>Confirmar Pago</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  subtitle: { fontSize: 16, marginBottom: 24 },
  payButton: {
    backgroundColor: "#9b59b6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
