// app/_layout.tsx
import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, StyleSheet, Text, ActivityIndicator } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../utils/firebaseconfig";

const publicRoutes = ["login", "register"];

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const currentPath = segments.join("/");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user && !publicRoutes.includes(currentPath)) {
        setTimeout(() => {
          router.replace("/login");
        }, 100);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [mounted, router, currentPath]);

  if (!mounted || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }
  return <>{children}</>;
}

function AppLayout() {
  return (
    <Stack
      initialRouteName="login"
      screenOptions={{
        headerShown: false, // Esconde el header en Login y Register
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthGate>
      <AppLayout />
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
