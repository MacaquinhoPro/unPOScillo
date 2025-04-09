import React, { useState, useRef } from 'react';
import { Text, Alert, View, Button } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function QRScanner({ navigation }: any) {
  const [scanned, setScanned] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const lastScanned = useRef<BarcodeScanningResult | null>(null);

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
        onBarcodeScanned={(result) => {
          console.log('ESCANEADO:', result);
          if (!scanned) {
            setQrData(result.data);
          }
        }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      {qrData && !scanned && (
        <View style={{
          position: 'absolute',
          bottom: 100,
          left: 20,
          right: 20,
          backgroundColor: 'rgba(0,0,0,0.6)',
          padding: 15,
          borderRadius: 10,
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 18, marginBottom: 10, color: 'white', textAlign: 'center' }}>
            Mesa detectada: {qrData}
          </Text>
          <Button
            title="Confirmar mesa"
            onPress={async () => {
              setScanned(true);
              await AsyncStorage.setItem('userId', qrData);
              Alert.alert("Mesa asignada", `ID: ${qrData}`);
              navigation.navigate('Menu');
            }}
          />
        </View>
      )}
    </View>
  );
}