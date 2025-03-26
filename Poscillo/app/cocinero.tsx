// app/cocinero.tsx
import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";

export default function CocineroScreen() {
  const orders = [
    { id: "1", table: "Mesa 1", items: ["Hamburguesa", "Pizza"] },
    { id: "2", table: "Mesa 2", items: ["Ensalada"] },
  ]; 

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Interfaz de Cocinero</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.orderItem}>
            <Text style={styles.orderTitle}>{item.table}</Text>
            <Text>Pedidos: {item.items.join(", ")}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 24, marginBottom: 16, textAlign: "center" },
  orderItem: { marginBottom: 16, padding: 12, backgroundColor: "#f0f0f0", borderRadius: 8 },
  orderTitle: { fontWeight: "bold", marginBottom: 4 },
});
