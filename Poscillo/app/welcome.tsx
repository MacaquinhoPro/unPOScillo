import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../utils/firebaseconfig";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        if (auth.currentUser) {
          const uid = auth.currentUser.uid;
          const db = getFirestore(auth.app);
          const userDoc = await getDoc(doc(db, "users", uid));

          if (userDoc.exists()) {
            const { role } = userDoc.data();
            console.log("User Role:", role); // Para depuración

            // Redirigir según el rol
            if (role === "cliente") {
              router.replace("/Cliente/cliente"); // Asumiendo que tienes un _layout.tsx en /app/cliente
            } else if (role === "cocinero") {
              router.replace("/cocinero");
            } else if (role === "caja") {
              router.replace("/caja/menu"); // Asumiendo que /app/caja tiene un _layout.tsx que dirige a /caja/menu
            } else {
              console.warn("Rol de usuario desconocido:", role);
              router.replace("/login");
            }
            return; // Importante para evitar que setLoading(false) se ejecute inmediatamente
          } else {
            console.warn("Documento de usuario no encontrado para:", uid);
          }
        }
        router.replace("/login"); // Si no hay currentUser o el documento no existe, redirigir a login
      } catch (error) {
        console.error("Error al obtener el rol del usuario:", error);
        router.replace("/login"); // En caso de error, redirigir a login
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // Ya no es necesario mostrar el texto temporal aquí, ya que deberíamos haber sido redirigidos.
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: "center", alignItems: "center", padding: 16, backgroundColor: "#fff",
  },
  welcomeText: { fontSize: 24, color: "#000", marginBottom: 24 },
});