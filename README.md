# 🍽️ Restaurante App - Gestión de Pedidos

Esta es una aplicación móvil desarrollada con **React Native + Expo Router**, que permite gestionar de manera eficiente los pedidos en un restaurante, integrando funcionalidades específicas según el rol del usuario: **cliente**, **cocinero** y **caja**. Utiliza **Firebase** para autenticación, base de datos en tiempo real (Firestore), y almacenamiento de imágenes (Storage).

🎥 **Video demostrativo de la app:**  
[Ver en YouTube](https://www.youtube.com/watch?v=NkgPfTAZ9A0)

---

## 🚻 Roles y Funcionalidades

### 👤 Cliente

El cliente puede:
- **Escanear un código QR** al ingresar para asignarse a una mesa.
- **Ver el menú** 
- **Enviar el pedido a cocina** una vez listo.
- **Ver el estado del pedido** en tiempo real, incluyendo animación de pasos ("carrito", "pendiente", "preparándose", "listo").
- **Pagar el pedido** cuando está listo, eliminando el pedido de la base de datos.
- **Cerrar sesión** desde el menú de navegación.

### 👨‍🍳 Cocinero

El cocinero puede:
- **Ver los pedidos pendientes y en preparación**.
- **Aceptar un pedido**, lo cual cambia su estado a `preparandose`.
- **Marcar un pedido como listo**, lo cual lo deja visible para el área de caja.
- **Cerrar sesión** desde el menú inferior.

### 💵 Caja

El usuario en caja puede:
- **Ver el menú** completo y **editar o eliminar platos**.
- **Agregar nuevos platos**, incluyendo imágenes y descripción.
- **Ver los pedidos listos para pagar**, filtrados por mesa.
- **Visualizar el detalle de cada cuenta** (productos, cantidades, precios).
- **Confirmar el pago**, lo cual elimina el pedido de la base de datos.
- **Cerrar sesión** desde el menú inferior.

---

## 🛠️ Configuración Técnica

### 📁 Estructura de Carpetas

```
/app
  /Cliente
    - _layout.tsx
    - carrito.tsx
    - cliente.tsx
    - logout.tsx
    - pedidoStatus.tsx
    - QRScanner.tsx
  /caja
    - _layout.tsx
    - cuentas.tsx
    - logout.tsx
    - menu.tsx
  /cocinero
    - _layout.tsx
    - logout.tsx
    - pedidos.tsx
  - index.tsx
  - login.tsx
  - register.tsx
  - welcome.tsx
  - _layout.tsx
/utils
  - firebaseconfig.ts
```

### 🔐 Autenticación

- Usa Firebase Authentication con email y contraseña.
- El usuario elige su **rol** durante el registro (`cliente`, `cocinero`, `caja`).
- El `AuthGate` redirecciona a `/login` si el usuario no está autenticado.

### 📦 Firestore - Estructura de Base de Datos

#### 📄 Colección `users`
```json
{
  "uid": "string",
  "name": "string",
  "email": "string",
  "role": "cliente" | "cocinero" | "caja"
}
```

#### 📄 Colección `dishes`
```json
{
  "title": "string",
  "description": "string",
  "price": number,
  "cookTime": "string",
  "imageURL": "string",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

#### 📄 Colección `orders`
```json
{
  "userId": "string",
  "tableId": "Mesa 1",
  "status": "cart" | "pending" | "preparandose" | "listo",
  "items": [
    {
      "id": "dishId",
      "title": "string",
      "price": number,
      "quantity": number
    }
  ],
  "createdAt": Timestamp
}
```

### ☁️ Firebase Storage

- Se utiliza para subir y almacenar imágenes de los platos.
- Las imágenes se guardan en la ruta `dishImages/`.

---

## ⚙️ Instalación y Configuración

### 🔧 Requisitos

- Node.js
- Expo CLI
- Cuenta en Firebase
- Permisos de cámara para usar QR y galería

### 🔌 Instalación de dependencias

```bash
npm install
npx expo install expo-camera expo-image-picker
npm install firebase
npm install @expo/vector-icons expo-router
npm install react-native-safe-area-context react-native-screens
```

### 🔐 Configuración de Firebase

En `utils/firebaseconfig.ts` define:

```ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

---

## 📱 Funcionalidades Especiales

- Uso de cámara para escaneo de códigos QR (Expo Camera).
- Notificaciones visuales (Alert) en todas las acciones críticas.
- Animaciones para estado de pedidos.
- Layouts separados por roles (`Tabs.Screen` por ruta).
- Guardado de imágenes en Firebase Storage con `uploadBytes()`.

---

## 📌 Notas Finales

- El proyecto utiliza `expo-router` para navegación basada en archivos.
- Asegúrate de tener las reglas de seguridad en Firebase configuradas correctamente.
- Puedes extender el sistema con funciones de administrador, estadísticas, o integración de pasarela de pagos.

---

¡Gracias por usar esta app de gestión de restaurante! ✨