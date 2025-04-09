import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert
} from "react-native";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../utils/firebaseconfig"; // Ajusta tu import de firebase
import { useRouter } from "expo-router";

type OrderItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;           // ID del doc en Firestore
  userId: string;       // O mesa, si así lo manejas
  status: string;
  items: OrderItem[];
  tableId: string;      // Nueva propiedad añadida
};

export default function CuentasScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // Suscribirse a todos los pedidos que estén en "listo"
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("status", "==", "listo"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: Order[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          userId: data.userId, // o data.mesa, según cómo lo guardes
          status: data.status,
          items: data.items || [],
          tableId: data.tableId, // Añadido el campo tableId
        };
      });
      setOrders(loaded);
    });

    return () => unsubscribe();
  }, []);

  // Abrir modal con detalles de la orden
  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedOrder(null);
  };

  // Calcular total de la orden
  const getOrderTotal = (order: Order) => {
    return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // Función para “Pagar”: borra el doc de Firestore
  const handlePay = async (orderId: string) => {
    Alert.alert(
      "Pagar",
      "¿Deseas confirmar el pago y cerrar la cuenta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, pagar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "orders", orderId));
              Alert.alert("Cuenta pagada", "La orden ha sido eliminada de Firestore.");
              closeModal();
            } catch (error) {
              console.error("Error al pagar/eliminar orden:", error);
              Alert.alert("Error", "No se pudo procesar el pago. Intenta de nuevo.");
            }
          },
        },
      ]
    );
  };

  // Renderizar cada pedido en la lista (vista resumida)
  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() => openOrderDetails(item)}
    >
      {/* En tu caso, "mesa" podría estar en userId, o un campo item.mesa */}
      <Text style={styles.orderTitle}>Mesa: {item.tableId}</Text>
      <Text style={styles.orderSubtitle}>Estado: {item.status}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Cuentas por cobrar (listo)</Text>
      {orders.length === 0 ? (
        <Text style={styles.infoText}>No hay pedidos en estado "listo".</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          renderItem={renderOrderItem}
          style={{ marginTop: 10 }}
        />
      )}

      {/* MODAL DETALLE DE UN PEDIDO */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeModal}
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedOrder ? (
              <>
                <Text style={styles.modalHeader}>
                  Detalle de la Mesa: {selectedOrder.tableId}
                </Text>
                {selectedOrder.items.length === 0 ? (
                  <Text style={styles.infoText}>No hay items</Text>
                ) : (
                  <FlatList
                    data={selectedOrder.items}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <View style={styles.itemRow}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemQuantity}>
                          x {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                        </Text>
                      </View>
                    )}
                    style={{ maxHeight: 250, marginVertical: 10 }}
                  />
                )}

                {/* Mostrar total */}
                <Text style={styles.totalText}>
                  Total: ${getOrderTotal(selectedOrder).toFixed(2)}
                </Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.payButton]}
                    onPress={() => handlePay(selectedOrder.id)}
                  >
                    <Text style={styles.buttonText}>Pagar y cerrar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={closeModal}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text>No hay pedido seleccionado.</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Estilos de ejemplo
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  infoText: {
    textAlign: "center",
    color: "#777",
    marginTop: 20,
  },
  orderItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  orderSubtitle: {
    fontSize: 16,
    color: "#555",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemTitle: { fontSize: 16 },
  itemQuantity: { fontSize: 16, fontWeight: "bold", color: "#333" },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "right",
    marginTop: 10,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "space-between",
  },
  button: {
    padding: 14,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  payButton: {
    backgroundColor: "green",
  },
  cancelButton: {
    backgroundColor: "#888",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});