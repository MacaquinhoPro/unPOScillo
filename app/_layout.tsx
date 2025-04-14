// app/_layout.tsx
import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../utils/firebaseconfig";

const publicRoutes = ["login", "register"];

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(false);
      if (!user && !publicRoutes.includes(segments[0])) {
        setTimeout(() => {
          router.replace("/login");
        }, 500);
      }
    });
    return () => unsubscribe();
  }, [mounted, segments, router]);

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
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="menu" />
      <Stack.Screen name="cliente" />
      <Stack.Screen name="cocinero" />
      <Stack.Screen name="caja" />
      <Stack.Screen name="index" />
      <Stack.Screen name="pagar" />
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
