// app/index.tsx
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../utils/firebaseconfig";

export default function Index() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Verifica si el usuario está autenticado
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(false); // Finalizamos el estado de carga

      if (user) {
        // Si el usuario está autenticado, redirige a la pantalla principal
        router.replace("/");
      } else {
        // Si el usuario no está autenticado, redirige a la pantalla de Login
        router.replace("/login");
      }
    });

    return () => unsubscribe(); // Limpia la suscripción cuando el componente se desmonte
  }, [isMounted, router]);

  if (loading) {
    return null; // O puedes mostrar un componente de carga si prefieres
  }

  return null; // No renderiza nada aquí, solo maneja la redirección
}
