// app/Cliente/Carrito.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { db, auth } from "../../utils/firebaseconfig";
import { collection, doc, onSnapshot, updateDoc, arrayRemove, arrayUnion, getDoc, query, where, setDoc } from "firebase/firestore";
import { useRouter } from "expo-router";

// Tipo local para los items del carrito
type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  // Agrega más campos si los tienes en tu order
};

export default function CarritoScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderDocId, setOrderDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    // Escuchamos la orden que esté en estado "cart"
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("userId", "==", user.uid), where("status", "==", "cart"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Tomamos el primer doc que coincida
        const docSnap = snapshot.docs[0];
        setOrderDocId(docSnap.id);
        const data = docSnap.data() as any;
        if (data.items) {
          setCartItems(data.items);
        } else {
          setCartItems([]);
        }
      } else {
        setOrderDocId(null);
        setCartItems([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Actualiza la cantidad de un ítem en el array (incremento o decremento)
  const updateItemQuantity = async (item: CartItem, newQuantity: number) => {
    if (!orderDocId) return;
    if (newQuantity < 1) {
      // Si llega a 0, mejor lo eliminamos completamente
      removeItem(item);
      return;
    }
    try {
      // Para actualizar la cantidad, tenemos que:
      // 1) quitar el ítem actual del array
      // 2) añadir un ítem con la nueva cantidad
      const orderRef = doc(db, "orders", orderDocId);

      // Quitar ítem anterior
      await updateDoc(orderRef, {
        items: arrayRemove(item),
      });
      // Añadir ítem con la cantidad modificada
      const updatedItem = { ...item, quantity: newQuantity };
      await updateDoc(orderRef, {
        items: arrayUnion(updatedItem),
      });
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
      Alert.alert("Error", "No se pudo actualizar la cantidad.");
    }
  };

  // Eliminar un ítem del array
  const removeItem = async (item: CartItem) => {
    if (!orderDocId) return;
    try {
      const orderRef = doc(db, "orders", orderDocId);
      await updateDoc(orderRef, {
        items: arrayRemove(item),
      });
    } catch (error) {
      console.error("Error al eliminar ítem:", error);
      Alert.alert("Error", "No se pudo eliminar el ítem.");
    }
  };

  // Botón “Mandar a cocina”: cambia el estado "cart" a "pending"
  const handleSendToKitchen = async () => {
    if (!orderDocId) {
      Alert.alert("Carrito vacío", "No hay nada que mandar a la cocina.");
      return;
    }
    try {
      const orderRef = doc(db, "orders", orderDocId);
      await updateDoc(orderRef, { status: "pending" });
      Alert.alert("Pedido enviado", "Tu pedido ha sido enviado a la cocina.");
      // Podrías navegar a /Cliente/pedidoStatus o donde gustes
      router.replace("/Cliente/pedidoStatus");
    } catch (error) {
      console.error("Error al cambiar estado a pending:", error);
      Alert.alert("Error", "No se pudo enviar el pedido a la cocina.");
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.itemRow}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.price}>${(item.price * item.quantity).toFixed(2)}</Text>
      <View style={styles.qtyContainer}>
        <TouchableOpacity
          style={styles.qtyButton}
          onPress={() => updateItemQuantity(item, item.quantity - 1)}
        >
          <Text style={styles.qtyButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.qtyButton}
          onPress={() => updateItemQuantity(item, item.quantity + 1)}
        >
          <Text style={styles.qtyButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => removeItem(item)}>
        <Text style={styles.removeText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando carrito...</Text>
      </View>
    );
  }

  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tu Carrito</Text>

      {cartItems.length === 0 ? (
        <Text style={styles.emptyText}>No tienes productos en tu carrito.</Text>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>

          <TouchableOpacity style={styles.sendButton} onPress={handleSendToKitchen}>
            <Text style={styles.sendButtonText}>¡Listo! Mandar a cocina</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", paddingTop: 60 },
  header: {
    fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 8,
  },
  itemTitle: { fontSize: 16, flex: 1 },
  price: { width: 60, textAlign: "right" },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
  },
  qtyButton: {
    backgroundColor: "#eee",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 4,
    borderRadius: 4,
  },
  qtyButtonText: { fontSize: 16, fontWeight: "bold" },
  quantityText: { fontSize: 16, fontWeight: "bold", minWidth: 20, textAlign: "center" },
  removeText: { color: "red", marginLeft: 4 },
  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: 40,
    fontSize: 16,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  totalLabel: { fontSize: 18, fontWeight: "bold" },
  totalValue: { fontSize: 18, fontWeight: "bold", color: "green" },
  sendButton: {
    backgroundColor: "rgb(52, 152, 219)",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
