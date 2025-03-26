// app/caja.tsx
import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";

export default function CajaScreen() {
  const bills = [
    {
      id: "1",
      table: "Mesa 1",
      items: [
        { name: "Hamburguesa", price: 10, quantity: 1 },
        { name: "Pizza", price: 12, quantity: 1 },
      ],
      total: 22,
    },
    {
      id: "2",
      table: "Mesa 2",
      items: [{ name: "Ensalada", price: 8, quantity: 1 }],
      total: 8,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Interfaz de Caja</Text>
      <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.billItem}>
            <Text style={styles.tableText}>{item.table}</Text>
            {item.items.map((it, index) => (
              <Text key={index}>
                {it.name} - ${it.price} x {it.quantity}
              </Text>
            ))}
            <Text style={styles.totalText}>Total: ${item.total}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 24, marginBottom: 16, textAlign: "center" },
  billItem: { marginBottom: 16, padding: 12, backgroundColor: "#f0f0f0", borderRadius: 8 },
  tableText: { fontWeight: "bold", marginBottom: 4 },
  totalText: { marginTop: 8, fontWeight: "bold" },
});
