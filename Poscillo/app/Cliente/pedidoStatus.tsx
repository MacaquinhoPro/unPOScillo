// app/Cliente/pedidoStatus.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { db, auth } from "../../utils/firebaseconfig";
import { doc, onSnapshot } from "firebase/firestore";

export default function PedidoStatusScreen() {
  const router = useRouter();
  const [status, setStatus] = useState("");

  // Leer el estado del pedido en tiempo real
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("No autenticado", "Debes iniciar sesión primero.");
      return;
    }
    const orderDocRef = doc(db, "orders", user.uid);
    const unsubscribe = onSnapshot(orderDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as any;
        setStatus(data.status);
      } else {
        setStatus("");
      }
    });
    return () => unsubscribe();
  }, []);

  // Si el pedido está "listo", mostramos un botón para ir a pagar
  const goPagar = () => {
    router.push("/Cliente/pagar");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Estado de tu Pedido</Text>

      {!status && (
        <Text style={styles.infoText}>No tienes un pedido activo.</Text>
      )}

      {status === "pending" && (
        <Text style={styles.statusText}>
          Tu pedido está en el carrito (pendiente).
        </Text>
      )}
      {status === "recibido" && (
        <Text style={styles.statusText}>
          ¡El chef recibió tu pedido!
        </Text>
      )}
      {status === "en cocina" && (
        <Text style={styles.statusText}>
          Tu pedido está preparándose...
        </Text>
      )}
      {status === "listo" && (
        <>
          <Text style={styles.statusText}>
            ¡Tu pedido está listo!
          </Text>
          <TouchableOpacity style={styles.payButton} onPress={goPagar}>
            <Text style={styles.payButtonText}>Pagar</Text>
          </TouchableOpacity>
        </>
      )}
      {status === "pagado" && (
        <Text style={styles.statusText}>
          Pedido pagado. ¡Gracias!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4", paddingTop: 60, padding: 16 },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  infoText: {
    textAlign: "center",
    color: "#666",
  },
  statusText: {
    textAlign: "center",
    fontSize: 18,
    marginVertical: 10,
  },
  payButton: {
    backgroundColor: "green",
    padding: 12,
    borderRadius: 6,
    marginTop: 20,
    alignSelf: "center",
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
