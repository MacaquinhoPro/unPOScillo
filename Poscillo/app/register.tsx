// app/register.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../utils/firebaseconfig";
import * as Haptics from "expo-haptics";

const getFriendlyError = (error: any): string => {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "Este correo electrónico ya está registrado.";
    case "auth/invalid-email":
      return "El correo electrónico no es válido.";
    case "auth/weak-password":
      return "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
    default:
      return "Error en el registro. Por favor, inténtalo de nuevo.";
  }
};

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    // Solo realiza el haptic feedback si no es una plataforma de escritorio (Mac o Windows)
    if (Platform.OS !== "macos" && Platform.OS !== "windows") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setError(""); // Limpiar error previo
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      await updateProfile(userCredential.user, { displayName: trimmedName });
      router.replace("/login"); // Redirige a la pantalla de login después de registrar
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyError(err));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Registrarse</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Botón de "Registrar" con fondo morado claro */}
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrar</Text>
      </TouchableOpacity>

      {/* Botón de "Volver" para regresar a Login */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.backButtonText}>Volver a Iniciar Sesión</Text>
      </TouchableOpacity>

      {/* El texto de "¿Ya tienes cuenta? Inicia sesión" siempre visible */}
      <TouchableOpacity onPress={() => router.push("/login")}>
        <Text style={styles.loginText}>¿Ya tienes cuenta? Inicia sesión</Text>
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
  header: {
    fontSize: 24,
    marginBottom: 24,
    color: "#000",
  },
  input: {
    width: "80%",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: "#000",
    borderColor: "#000",
  },
  registerButton: {
    width: "80%",
    backgroundColor: "#9b59b6", // Color morado claro
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    width: "80%",
    backgroundColor: "#f0f0f0", // Color gris claro para el botón de volver
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "#fff", // Texto blanco dentro del botón
    fontSize: 16,
  },
  backButtonText: {
    color: "#000", // Texto negro para el botón de "Volver"
    fontSize: 16,
  },
  loginText: {
    fontSize: 16,
    color: "#000",
    marginTop: 12,
  },
  errorText: {
    color: "#ff4d4d",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
});
