import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "../utils/firebaseconfig";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const db = getFirestore(auth.app);
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          const { role } = userDoc.data();
          // Redirigir según el rol
          if (role === "cliente") {
            router.replace("/cliente");
          } else if (role === "cocinero") {
            router.replace("/cocinero");
          } else if (role === "caja") {
            router.replace("/caja");
          } else {
            router.replace("/login"); // En caso de rol desconocido
          }
        }
      }
      setLoading(false);
    };

    fetchUserRole();
  }, [router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="rgb(247, 194, 88)" /> {/* Color actualizado */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Bienvenido al sistema POS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  welcomeText: {
    fontSize: 24,
    color: "#000",
    marginBottom: 24,
  },
});
