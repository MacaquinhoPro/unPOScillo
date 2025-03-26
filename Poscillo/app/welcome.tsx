// app/welcome.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "../utils/firebaseconfig";

export default function WelcomeScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth); // Cierra la sesión en Firebase
      router.replace("/login"); // Redirige al usuario a la pantalla de Login
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Bienvenido al sistema POS</Text>

      {/* Botón de Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
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
  logoutButton: {
    width: "80%",
    backgroundColor: "#e74c3c", // Color rojo para el botón de logout
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#fff", // Texto blanco dentro del botón
    fontSize: 16,
  },
});
