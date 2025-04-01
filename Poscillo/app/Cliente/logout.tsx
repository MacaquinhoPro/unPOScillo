// app/cliente/logout.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function LogoutScreen() {
  const router = useRouter();

  const handleLogout = () => {
    // Aquí deberías implementar la lógica para cerrar la sesión del usuario.
    console.log('Cerrando sesión del cliente...');
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        onPress: () => {
          router.push('/'); // Redirige a la pantalla de inicio de sesión principal.
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Cerrar Sesión?</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});