import React, { useState } from "react";
import {View,  Text,  TextInput,  TouchableOpacity,  StyleSheet,  Platform,} from "react-native";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../utils/firebaseconfig";
import * as Haptics from "expo-haptics";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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
  const [selectedType, setSelectedType] = useState<"cliente" | "admin" | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [adminRole, setAdminRole] = useState<"cocinero" | "caja" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleRegister = async () => {
    if (Platform.OS !== "macos" && Platform.OS !== "windows") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setError("");
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    const finalRole = selectedType === "cliente" ? "cliente" : adminRole;
    if (!finalRole) {
      setError("Error al determinar tu rol.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );
      await updateProfile(userCredential.user, { displayName: trimmedName });

      const db = getFirestore(auth.app);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        role: finalRole,
        name: trimmedName,
        email: trimmedEmail,
      });

      router.replace("/login");
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyError(err));
    }
  };

  if (!selectedType) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Seleccione el Tipo de Usuario</Text>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setSelectedType("cliente")}
        >
          <Text style={styles.selectorButtonText}>Registrarme como Cliente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setSelectedType("admin")}
        >
          <Text style={styles.selectorButtonText}>
            Registrarme como Caja o Cocinero
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (selectedType === "admin" && !adminRole) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Clave de Administrador</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TextInput
          style={styles.input}
          placeholder="Clave de administrador"
          placeholderTextColor="#888"
          secureTextEntry
          value={adminKey}
          onChangeText={setAdminKey}
        />
        <Text style={styles.label}>Seleccione su rol</Text>
        <View style={styles.adminButtonsContainer}>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => {
              if (adminKey.trim() !== "123456") {
                setError("Clave de administrador incorrecta.");
              } else {
                setAdminRole("cocinero");
                setError("");
              }
            }}
          >
            <Text style={styles.selectorButtonText}>Cocinero</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => {
              if (adminKey.trim() !== "123456") {
                setError("Clave de administrador incorrecta.");
              } else {
                setAdminRole("caja");
                setError("");
              }
            }}
          >
            <Text style={styles.selectorButtonText}>Caja</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            // Volver a la selección inicial
            setSelectedType(null);
            setAdminKey("");
            setAdminRole(null);
            setError("");
          }}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Registrarse</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Text style={styles.label}>
        {selectedType === "cliente"
          ? "Registrándote como Cliente"
          : adminRole === "cocinero"
          ? "Registrándote como Cocinero"
          : "Registrándote como Caja"}
      </Text>
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
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/login")}>
        <Text style={styles.loginText}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setSelectedType(null);
          setAdminKey("");
          setAdminRole(null);
          setError("");
        }}
      >
        <Text style={styles.backButtonText}>Cambiar Tipo de Usuario</Text>
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
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#000",
    textAlign: "center",
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
  selectorButton: {
    width: "80%",
    backgroundColor: "rgb(247, 194, 88)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  selectorButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  registerButton: {
    width: "80%",
    backgroundColor: "rgb(247, 194, 88)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 12,
  },
  buttonText: {
    color: "#fff",
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
  adminButtonsContainer: {
    flexDirection: "column", 
    width: "80%",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    marginTop: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: "#007bff",
    textDecorationLine: "underline",
  },
});