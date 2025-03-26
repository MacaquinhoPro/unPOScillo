// app/cliente.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function ClienteScreen() {
  const router = useRouter();
  const [table, setTable] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const menuItems = [
    { id: "1", name: "Hamburguesa", price: 10, time: "5 min" },
    { id: "2", name: "Pizza", price: 12, time: "8 min" },
    { id: "3", name: "Ensalada", price: 8, time: "3 min" },
  ];

  const scanQR = () => {
    // Simulamos la lectura de un QR
    setTable("Mesa 1");
  };

  const addToCart = (item: any) => {
    setCart([...cart, item]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Interfaz de Cliente</Text>
      <TouchableOpacity style={styles.button} onPress={scanQR}>
        <Text style={styles.buttonText}>Escanear QR</Text>
      </TouchableOpacity>
      {table && <Text style={styles.tableText}>Estás en: {table}</Text>}
      <Text style={styles.subHeader}>Menú</Text>
      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.menuItem}>
            <Text>
              {item.name} - ${item.price} ({item.time})
            </Text>
            <TouchableOpacity onPress={() => addToCart(item)} style={styles.button}>
              <Text style={styles.buttonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <TouchableOpacity style={styles.payButton} onPress={() => router.push("/pagar")}>
        <Text style={styles.buttonText}>Ir a pagar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 24, marginBottom: 16, textAlign: "center" },
  subHeader: { fontSize: 18, marginTop: 16, marginBottom: 8 },
  tableText: { fontSize: 16, marginBottom: 16, textAlign: "center" },
  menuItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 8 },
  button: { backgroundColor: "#9b59b6", padding: 8, borderRadius: 5 },
  payButton: { backgroundColor: "#27ae60", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 16 },
  buttonText: { color: "#fff" },
});
