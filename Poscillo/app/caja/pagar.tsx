import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from "react-native";
import { useRouter } from "expo-router";

// Define el tipo para los ítems de compra (debería ser el mismo que usas en MenuScreen)
type Dish = {
  id: string;
  title: string;
  price: number;
  // ... otras propiedades si las tienes
};

// Simulación de los ítems a pagar.
// En una aplicación real, estos vendrían de un estado global o se pasarían a esta pantalla.
const initialPurchaseItems: Dish[] = [
  { id: "1", title: "Hamburguesa", price: 10 },
  { id: "2", title: "Pizza", price: 12 },
  { id: "3", title: "Refresco", price: 3 },
];

export default function PagarScreen() {
  const router = useRouter();
  const [purchaseItems, setPurchaseItems] = useState<Dish[]>(initialPurchaseItems);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Calcula el total cada vez que los ítems de compra cambian
    const newTotal = purchaseItems.reduce((sum, item) => sum + item.price, 0);
    setTotal(newTotal);
  }, [purchaseItems]);

  const handleFinishPayment = () => {
    // Aquí pones la lógica de cobro real
    // (por ejemplo, enviar la información del pedido y el total a un servidor)
    console.log("Procesando pago por:", total);
    Alert.alert("Pago Confirmado", `Se ha realizado el pago por $${total}`);
    // Después de procesar el pago, podrías limpiar el carrito o redirigir a otra pantalla
    // setPurchaseItems([]); // Limpiar el carrito
    router.back(); // vuelve al tab anterior o a donde prefieras
  };

  const renderItem = ({ item }: { item: Dish }) => (
    <View style={styles.listItem}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemPrice}>${item.price}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla de Pago</Text>

      {purchaseItems.length > 0 ? (
        <>
          <FlatList
            data={purchaseItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={styles.list}
          />
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total:</Text>
            <Text style={styles.totalAmount}>${total}</Text>
          </View>
          <TouchableOpacity style={styles.payButton} onPress={handleFinishPayment}>
            <Text style={styles.payButtonText}>Confirmar Pago</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.emptyText}>No hay productos para pagar.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4", padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#333", textAlign: "center" },
  list: { marginBottom: 20 },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemTitle: { fontSize: 18, color: "#333" },
  itemPrice: { fontSize: 18, fontWeight: "bold", color: "green" },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderTopWidth: 2,
    borderTopColor: "#ccc",
  },
  totalText: { fontSize: 20, fontWeight: "bold", color: "#333" },
  totalAmount: { fontSize: 20, fontWeight: "bold", color: "green" },
  payButton: {
    backgroundColor: "#27ae60", // Un color verde para el botón de pagar
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  payButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 50,
  },
});