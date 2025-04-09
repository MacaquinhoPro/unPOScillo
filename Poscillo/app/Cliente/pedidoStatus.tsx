import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
  Animated,
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

// Cada paso se renderiza en una fila: círculo a la izquierda y etiqueta a la derecha
const StepItem = ({
  step,
  index,
  currentStepIndex,
  totalSteps,
}: {
  step: { id: string; label: string };
  index: number;
  currentStepIndex: number;
  totalSteps: number;
}) => {
  const isCompleted = index < currentStepIndex;
  const isCurrent = index === currentStepIndex;

  // Valor animado para el pulso en el paso actual
  const scaleAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isCurrent) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      scaleAnim.setValue(1);
    }
    return () => animation?.stop();
  }, [isCurrent, scaleAnim]);

  let iconContent: JSX.Element;
  if (isCompleted) {
    // Círculo verde con check blanco
    iconContent = (
      <View style={styles.completedCircle}>
        <Text style={styles.checkIcon}>✓</Text>
      </View>
    );
  } else if (isCurrent) {
    // Círculo azul animado
    iconContent = (
      <Animated.Text
        style={[
          styles.currentIcon,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        ●
      </Animated.Text>
    );
  } else {
    // Círculo vacío para pasos futuros
    iconContent = <Text style={styles.futureIcon}>○</Text>;
  }

  return (
    <View style={styles.stepRow}>
      <View style={styles.iconColumn}>
        {iconContent}
        {index < totalSteps - 1 && <View style={styles.verticalLine} />}
      </View>
      <View style={styles.textColumn}>
        <Text style={styles.stepLabel}>{step.label}</Text>
      </View>
    </View>
  );
};

export default function PedidoTrackingScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [orderExists, setOrderExists] = useState(false);

  // Pasos según el flujo original
  const steps = [
    { id: "cart", label: "Pedido en carrito" },
    { id: "pending", label: "El cocinero aceptó tu pedido" },
    { id: "preparandose", label: "Tu pedido se está preparando" },
    { id: "listo", label: "¡Pedido listo!" },
  ];

  const [status, setStatus] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [createdAt, setCreatedAt] = useState<Date | null>(null);

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
        setCreatedAt(data.createdAt?.toDate?.() || null);
      } else {
        setOrderExists(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePay = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await deleteDoc(doc(db, "orders", user.uid));
      Alert.alert("Pago exitoso", "El pedido ha sido pagado y completado.");
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
      {/* Timeline vertical en forma de filas */}
      <View style={styles.timelineContainer}>
        {steps.map((step, index) => (
          <StepItem
            key={step.id}
            step={step}
            index={index}
            currentStepIndex={currentStepIndex}
            totalSteps={steps.length}
          />
        ))}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Estado actual: {status}</Text>
        {createdAt && (
          <Text style={styles.infoText}>
            Pedido creado: {createdAt.toLocaleString()}
          </Text>
        )}
      </View>
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
    backgroundColor: "#f9f9f9",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  /* TIMELINE */
  timelineContainer: {
    flexDirection: "column",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconColumn: {
    width: 30,
    alignItems: "center",
    position: "relative",
  },
  verticalLine: {
    position: "absolute",
    top: 30, // Partiendo del final del círculo (30px de alto)
    left: 14, // Centrado: (30/2 - lineWidth/2)
    width: 2,
    height: 24,
    backgroundColor: "#cccccc",
  },
  textColumn: {
    marginLeft: 10,
    flex: 1,
    justifyContent: "center",
  },
  completedCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "green",
    justifyContent: "center",
    alignItems: "center",
  },
  checkIcon: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  currentIcon: {
    fontSize: 30,
    color: "#007bff",
    fontWeight: "bold",
  },
  futureIcon: {
    fontSize: 26,
    color: "#ccc",
  },
  stepLabel: {
    fontSize: 14,
    color: "#333",
    textAlign: "left",
  },
  /* INFO DEL PEDIDO */
  infoContainer: {
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  infoText: {
    fontSize: 16,
    color: "#555",
    marginVertical: 2,
  },
  productsHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  list: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
  },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  /* BOTÓN DE PAGO */
  payContainer: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
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
