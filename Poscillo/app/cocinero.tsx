// app/cocinero.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from "react-native";
import { db } from "../utils/firebaseconfig";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";

type Order = {
  id: string;
  userId: string;
  status: string;
  items: {
    id: string;
    title: string;
    price: number;
    quantity: number;
  }[];
};

export default function CocineroScreen() {
  const [orders, setOrders] = useState<Order[]>([]);

  // Escuchamos pedidos que estén en "pending" o "preparandose"
  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef, 
      where("status", "in", ["pending", "preparandose"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map((docSnap) => {
        return { id: docSnap.id, ...docSnap.data() } as Order;
      });
      setOrders(loaded);
    });

    return () => unsubscribe();
  }, []);

  // Aceptar pedido => estado "preparandose"
  const handleAccept = async (orderId: string) => {
    if (!orderId) {
      Alert.alert("Error", "No se recibió un ID de pedido válido.");
      return;
    }

    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: "preparandose" });
      Alert.alert("Pedido aceptado", "El pedido ha pasado a 'preparandose'.");
      // Si quisieras redirigir o refrescar, podrías hacerlo aquí
    } catch (error) {
      console.error("Error al cambiar estado a 'preparandose':", error);
      Alert.alert("Error", "No se pudo cambiar el estado a 'preparandose'.");
    }
  };

  // Pedido listo => estado "listo"
  const handleReady = async (orderId: string) => {
    if (!orderId) {
      Alert.alert("Error", "No se recibió un ID de pedido válido.");
      return;
    }

    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: "listo" });
      Alert.alert("Pedido listo", "El pedido ahora está en estado 'listo'.");
      // Si quisieras redirigir o refrescar, podrías hacerlo aquí
    } catch (error) {
      console.error("Error al cambiar estado a 'listo':", error);
      Alert.alert("Error", "No se pudo cambiar el estado a 'listo'.");
    }
  };


  // Render de cada pedido
  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Pedido ID: {item.id}</Text>
      <Text>Usuario/Mesa: {item.userId}</Text>
      <Text>Estado: {item.status}</Text>

      <Text style={{ marginVertical: 8, fontWeight: "bold" }}>Productos:</Text>
      {item.items.map((dish, index) => (
        <Text key={index}>• {dish.title} x {dish.quantity}</Text>
      ))}

      <View style={styles.actions}>
        {item.status === "pending" && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#2980b9" }]}
            onPress={() => handleAccept(item.id)}
          >
            <Text style={styles.btnText}>Aceptar</Text>
          </TouchableOpacity>
        )}
        {item.status === "preparandose" && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "green" }]}
            onPress={() => handleReady(item.id)}
          >
            <Text style={styles.btnText}>Listo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pedidos (Cocinero)</Text>
      {orders.length === 0 && (
        <Text style={styles.infoText}>No hay pedidos pendientes.</Text>
      )}
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={renderItem}
      />
    </View>
  );
}

// ======== ESTILOS ========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: "#ecf0f1",
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  infoText: {
    textAlign: "center",
    color: "#999",
  },
  card: {
    backgroundColor: "#fff",
    marginBottom: 12,
    borderRadius: 8,
    padding: 12,
  },
  cardTitle: {
    fontWeight: "bold",
    marginBottom: 6,
    fontSize: 16,
  },
  actions: {
    flexDirection: "row",
    marginTop: 12,
  },
  btn: {
    padding: 10,
    borderRadius: 6,
    marginRight: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
