import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity
} from "react-native";
import { useRouter } from "expo-router";
import { doc, onSnapshot, deleteDoc } from "firebase/firestore";
import { auth, db } from "./../../utils/firebaseconfig";

type OrderItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
};

export default function PedidoTrackingScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [orderExists, setOrderExists] = useState(false);

  const [status, setStatus] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [createdAt, setCreatedAt] = useState<Date | null>(null);

  // Para mostrar un timeline de los estados
  // Puedes personalizar las labels y la lógica de “check”/“pendiente”
  const steps = [
    { id: "cart", label: "Pedido en carrito" },
    { id: "pending", label: "El local recibió tu pedido" },
    { id: "preparandose", label: "El local está preparando tu pedido" },
    { id: "listo", label: "Tu pedido está listo" },
    // Si quisieras un estado "pagado", lo agregarías aquí también.
  ];

  // Obtenemos el índice del estado actual en el array anterior
  const currentStepIndex = steps.findIndex((step) => step.id === status);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("No autenticado", "Debes iniciar sesión para ver tu pedido.");
      router.replace("/login");
      return;
    }

    const orderRef = doc(db, "orders", user.uid);
    const unsubscribe = onSnapshot(orderRef, (snapshot) => {
      if (snapshot.exists()) {
        setOrderExists(true);
        const data = snapshot.data() as any;
        setStatus(data.status || "");
        setItems(data.items || []);
        // Si createdAt es un Timestamp de Firestore, conviértelo a Date
        setCreatedAt(data.createdAt?.toDate?.() || null);
      } else {
        // No existe doc => no hay pedido
        setOrderExists(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Calculamos el total a pagar
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Función para “pagar”
  const handlePay = async () => {
    const user = auth.currentUser;
    if (!user) {
      return;
    }

    // Aquí podrías integrar tu pasarela de pagos real.
    // Al final, si tu flow es borrar el doc:
    try {
      await deleteDoc(doc(db, "orders", user.uid));
      Alert.alert("Pago exitoso", "El pedido ha sido pagado y completado.");
      // Redirigir a donde gustes
      router.replace("/Cliente/cliente");
    } catch (error) {
      console.error("Error al borrar el pedido:", error);
      Alert.alert("Error", "No se pudo completar el pago. Intenta de nuevo.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!orderExists) {
    return (
      <View style={styles.center}>
        <Text>No tienes un pedido activo.</Text>
      </View>
    );
  }

  // Renderizamos una “línea de estados” (timeline) en vertical u horizontal
  // Para cada estado, vemos si es “pasado”, “actual” o “futuro”
  const renderStep = (step: { id: string; label: string }, index: number) => {
    const isCompleted = index < currentStepIndex; // si está antes del actual
    const isCurrent = index === currentStepIndex; // si es el estado actual
    return (
      <View key={step.id} style={styles.stepContainer}>
        <View style={styles.stepIcon}>
          {/* Renderiza un icono distinto si está completado, actual o futuro */}
          {isCompleted ? (
            <Text style={styles.completedIcon}>✓</Text>
          ) : isCurrent ? (
            <Text style={styles.currentIcon}>•</Text>
          ) : (
            <Text style={styles.futureIcon}>○</Text>
          )}
        </View>
        <Text style={styles.stepLabel}>{step.label}</Text>
      </View>
    );
  };

  // Render de cada producto
  const renderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.itemRow}>
      <Text style={{ flex: 1 }}>{item.title}</Text>
      <Text style={{ marginHorizontal: 10 }}>
        x {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Estado de tu Pedido</Text>

      {/* Timeline de estados */}
      <View style={styles.timelineContainer}>
        {steps.map(renderStep)}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Estado actual: {status}</Text>
        {createdAt && (
          <Text style={styles.infoText}>
            Pedido creado: {createdAt.toLocaleString()}
          </Text>
        )}
      </View>

      {/* Lista de productos */}
      <Text style={styles.productsHeader}>Productos del pedido:</Text>
      {items.length === 0 ? (
        <Text style={{ textAlign: "center", marginVertical: 8 }}>
          No hay productos en tu pedido.
        </Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
        />
      )}

      {/* Si el estado es "listo", mostrar botón de pago */}
      {status === "listo" && (
        <View style={styles.payContainer}>
          <Text style={styles.totalText}>Total: ${total.toFixed(2)}</Text>
          <TouchableOpacity style={styles.payButton} onPress={handlePay}>
            <Text style={styles.payButtonText}>Pagar y Finalizar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, justifyContent: "center", alignItems: "center",
  },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20,
  },
  timelineContainer: {
    marginBottom: 20,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stepIcon: {
    marginRight: 8,
  },
  completedIcon: {
    color: "green", fontWeight: "bold",
  },
  currentIcon: {
    color: "blue", fontSize: 22, fontWeight: "bold",
  },
  futureIcon: {
    color: "#ccc", fontSize: 18,
  },
  stepLabel: {
    fontSize: 16,
    color: "#333",
  },
  infoContainer: {
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: "#555",
    marginVertical: 4,
  },
  productsHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  list: { marginBottom: 20 },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  payContainer: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "right",
  },
  payButton: {
    backgroundColor: "green",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
