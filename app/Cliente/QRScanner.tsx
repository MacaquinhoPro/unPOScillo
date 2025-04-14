import React, { useState } from 'react';
import { Text, Alert, View, Button } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult,} from 'expo-camera';
import { auth, db } from '../../utils/firebaseconfig';
import {  collection,  query,  where,  getDocs,  updateDoc,  doc,} from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function QRScanner() {
  const [scanned, setScanned] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={{ textAlign: 'center', paddingBottom: 10 }}>
          Necesitamos permisos para usar la cámara
        </Text>
        <Button onPress={requestPermission} title="Dar permiso" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        onBarcodeScanned={(result: BarcodeScanningResult) => {
          if (!scanned) {
            setQrData(result.data);
          }
        }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {qrData && !scanned && (
        <View
          style={{
            position: 'absolute',
            bottom: 100,
            left: 20,
            right: 20,
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: 15,
            borderRadius: 10,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 18,
              marginBottom: 10,
              color: 'white',
              textAlign: 'center',
            }}
          >
            Mesa detectada: {qrData}
          </Text>
          <Button
            title="Confirmar mesa"
            onPress={async () => {
              setScanned(true);
              const user = auth.currentUser;
              if (user) {
                try {
                  const ordersRef = collection(db, 'orders');
                  const q = query(
                    ordersRef,
                    where('userId', '==', user.uid),
                    where('status', '==', 'cart')
                  );
                  const querySnap = await getDocs(q);

                  if (!querySnap.empty) {
                    const docSnap = querySnap.docs[0];
                    await updateDoc(doc(db, 'orders', docSnap.id), {
                      tableId: qrData,
                    });
                    Alert.alert('Mesa asignada', `ID: ${qrData}`);
                    router.push('/Cliente/carrito'); 
                  } else {
                    Alert.alert(
                      'Pedido no encontrado',
                      "No tienes un pedido en estado 'cart'."
                    );
                  }
                } catch (error) {
                  console.error(error);
                  Alert.alert(
                    'Error',
                    'Ocurrió un error al actualizar la mesa.'
                  );
                }
              } else {
                Alert.alert(
                  'Usuario no autenticado',
                  'Por favor, inicia sesión.'
                );
              }
            }}
          />
        </View>
      )}
    </View>
  );
}
