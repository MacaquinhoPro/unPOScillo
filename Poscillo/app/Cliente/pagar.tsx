import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from "react-native";
import { useRouter } from "expo-router";
import { db, auth } from "../../utils/firebaseconfig";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";

// Define el tipo para los ítems de compra
type Dish = {
  id: string;
  title: string;
  price: number;
  quantity: number;
};

export default function PagarScreen() {
  const router = useRouter();
  const [purchaseItems, setPurchaseItems] = useState<Dish[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDocId, setOrderDocId] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false); // Nuevo estado para indicar si se está pagando

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userId = user.uid;
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("userId", "==", userId), where("status", "==", "pending"));

        const unsubscribeOrders = onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const orderDoc = snapshot.docs[0];
              const orderData = orderDoc.data();
              setOrderDocId(orderDoc.id);
              if (orderData && orderData.items) {
                setPurchaseItems(orderData.items as Dish[]);
              } else {
                setPurchaseItems([]);
              }
            } else {
              setPurchaseItems([]);
              setOrderDocId(null);
            }
            setLoading(false);
          },
          (err) => {
            setError("Error al cargar el pedido.");
            console.error("Error al cargar el pedido:", err);
            setLoading(false);
          }
        );
        return () => unsubscribeOrders();
      } else {
        setPurchaseItems([]);
        setLoading(false);
        setOrderDocId(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const newTotal = purchaseItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotal(newTotal);
  }, [purchaseItems]);

  const handlePay = async () => {
    if (isPaying) {
      return; // Evita múltiples clics mientras se está pagando
    }

    if (purchaseItems.length > 0 && orderDocId) {
      setIsPaying(true);
      console.log("Iniciando proceso de pago para el pedido:", orderDocId);
      try {
        const orderRef = doc(db, "orders", orderDocId);
        console.log("Referencia al documento creada:", orderRef.path);
        await deleteDoc(orderRef);
        console.log("Pedido eliminado exitosamente de Firestore.");

        Alert.alert("Pago Exitoso", `Tu pago de $${total.toFixed(2)} ha sido procesado.`);
        setPurchaseItems([]);
        setTotal(0);
        setOrderDocId(null);
        setIsPaying(false);
        console.log("Navegando hacia atrás.");
        router.back(); // Intenta con router.back()
      } catch (error) {
        console.error("Error al eliminar el pedido de Firestore:", error);
        Alert.alert("Error al Pagar", `Hubo un problema al procesar el pago: ${(error as Error).message}`);
        setIsPaying(false);
      }
    } else if (purchaseItems.length === 0) {
      Alert.alert("Carrito Vacío", "No hay productos en tu carrito para pagar.");
    } else {
      Alert.alert("Error", "No se pudo encontrar el pedido para eliminar.");
    }
  };

  const renderItem = ({ item }: { item: Dish }) => (
    <View style={styles.listItem}>
      <Text style={styles.itemTitle}>{item.title} x {item.quantity}</Text>
      <Text style={styles.itemPrice}>${item.price * item.quantity}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Tu Pedido</Text>
        <Text>Cargando tu pedido...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Tu Pedido</Text>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu Pedido</Text>

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
            <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.payButton}
            onPress={handlePay}
            disabled={isPaying} // Deshabilitar el botón mientras se paga
          >
            <Text style={styles.payButtonText}>{isPaying ? "Procesando..." : "Pagar"}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.emptyText}>Tu carrito está vacío.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
    padding: 16,
    paddingTop: 60, // Ajuste para la Isla Dinámica
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
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
    backgroundColor: "rgb(52, 152, 219)", // Un color azul para el botón de pagar del cliente
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