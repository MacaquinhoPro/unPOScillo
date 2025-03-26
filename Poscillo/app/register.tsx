import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../utils/firebaseconfig";
import * as Haptics from "expo-haptics";
import ActionSheet from "react-native-actionsheet"; // Usamos react-native-actionsheet
// Importamos Firestore
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Definir opciones para los roles de usuario
const userRoles = [
  { label: "Cliente", value: "cliente", image: require("../assets/images/cliente.png") },
  { label: "Cocinero", value: "cocinero", image: require("../assets/images/cocinero.png") },
  { label: "Caja", value: "caja", image: require("../assets/images/caja.png") },
];

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
  const [userRole, setUserRole] = useState("cliente"); // rol por defecto
  const [error, setError] = useState("");

  const actionSheetRef = React.useRef<ActionSheet>(null); // Referencia al ActionSheet

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
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      // Actualizamos el perfil del usuario con el nombre
      await updateProfile(userCredential.user, { displayName: trimmedName });
      
      // Guardamos el rol del usuario en Firestore
      const db = getFirestore(auth.app);
      await setDoc(doc(db, "users", userCredential.user.uid), { 
        role: userRole,
        name: trimmedName,
        email: trimmedEmail
      });
      
      router.replace("/login"); // Redirige a la pantalla de login después de registrar
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyError(err));
    }
  };

  // Función para abrir el ActionSheet
  const openActionSheet = () => {
    actionSheetRef.current?.show(); // Abre el ActionSheet utilizando la referencia
  };

  // Manejar la selección del ActionSheet
  const handleActionSheetPress = (index: number) => {
    if (index !== userRoles.length) { // Evitar seleccionar "Cancelar"
      setUserRole(userRoles[index].value);
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

      {/* Botón que abre el ActionSheet para seleccionar el rol */}
      <Text style={styles.label}>Tipo de usuario</Text>
      <TouchableOpacity style={styles.pickerContainer} onPress={openActionSheet}>
        <Text style={styles.pickerText}>{userRoles.find((role) => role.value === userRole)?.label}</Text>
      </TouchableOpacity>

      {/* ActionSheet */}
      <ActionSheet
        ref={actionSheetRef} // Asignamos la referencia al ActionSheet
        title="Selecciona un rol"
        options={[...userRoles.map((item) => item.label), "Cancelar"]} // Opciones del ActionSheet
        cancelButtonIndex={userRoles.length} // El último índice es el de "Cancelar"
        onPress={handleActionSheetPress} // Callback cuando se presiona una opción
      />

      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrar</Text>
      </TouchableOpacity>

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
  label: {
    fontSize: 16,
    marginBottom: 8,
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
  pickerContainer: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  pickerText: {
    fontSize: 16,
    color: "#000",
  },
  registerButton: {
    width: "80%",
    backgroundColor: "rgb(247, 194, 88)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
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
});
