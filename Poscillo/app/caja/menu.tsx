import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  FlatList,
  Alert,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { CameraType, useCameraPermissions } from "expo-camera";

// Importar Firebase (asegúrate de exportar storage desde tu firebaseconfig)
import { db, auth, storage } from "../../utils/firebaseconfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  arrayUnion,
  setDoc,
  getDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Tipo de cada plato
type Dish = {
  id: string;
  image: any;       // Se mantiene "any" para no romper la lógica actual (el cliente usa `item.image`)
  title: string;
  description: string;
  price: number;
  cookTime: string;
  quantity?: number; // cuando se agrega al carrito
};

type MenuScreenProps = {
  role: "cliente" | "caja";
};

export default function MenuScreen({ role }: MenuScreenProps) {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();

  // Estado para guardar la lista de platos
  const [dishes, setDishes] = useState<Dish[]>([]);

  // Control formulario crear/editar
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCookTime, setNewCookTime] = useState("");
  const [newImage, setNewImage] = useState<string>(""); // URI local de la nueva imagen
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  // Estados para el modal del plato (cliente)
  const [isDishModalVisible, setDishModalVisible] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [quantity, setQuantity] = useState(1);

  // ====== 1) CARGAR PLATOS DE FIRESTORE AL MONTAR =======
  useEffect(() => {
    const dishesRef = collection(db, "dishes");
    const q = query(dishesRef, orderBy("createdAt", "desc"));

    // onSnapshot para escuchar en tiempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedDishes: Dish[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          // Convertimos la URL en { uri: ... } para que la parte "cliente" use `item.image`.
          // Si no hay imageURL, mostramos un require de "Sin imagen" (o un placeholder).
          image: data.imageURL
            ? { uri: data.imageURL }
            : require("../../assets/images/Ensalada.png"), 
            // Ajusta si quieres un placeholder local
          title: data.title,
          description: data.description,
          price: data.price,
          cookTime: data.cookTime,
        };
      });
      setDishes(loadedDishes);
    });

    return () => unsubscribe();
  }, []);

  // ======= 2) MANEJAR SELECCIÓN DE IMAGEN (CÁMARA/GALERÍA) =======
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "No se concedió acceso a la galería.");
        return;
      }

      Alert.alert("Seleccionar Imagen", "¿De dónde deseas obtener la imagen?", [
        {
          text: "Cámara",
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.7,
            });
            if (!result.canceled && result.assets?.length) {
              setNewImage(result.assets[0].uri);
            }
          },
        },
        {
          text: "Galería",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.7,
            });
            if (!result.canceled && result.assets?.length) {
              setNewImage(result.assets[0].uri);
            }
          },
        },
        { text: "Cancelar", style: "cancel" },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo acceder a la galería/cámara.");
    }
  };

  // ======= 3) CREAR O EDITAR PLATO EN FIRESTORE =======
  const handleAddDish = async () => {
    if (!newTitle.trim() || !newPrice.trim() || !newCookTime.trim()) {
      Alert.alert("Campos incompletos", "Todos los campos son obligatorios.");
      return;
    }

    try {
      let imageURL = "";

      // Si el usuario seleccionó una nueva imagen, la subimos a Storage
      if (newImage) {
        const fileRef = ref(storage, `dishImages/${Date.now()}`);
        const resp = await fetch(newImage);
        const blob = await resp.blob();
        await uploadBytes(fileRef, blob);
        imageURL = await getDownloadURL(fileRef);
      }

      if (editingDish) {
        // EDICIÓN: Actualizar doc en Firestore
        const dishDocRef = doc(db, "dishes", editingDish.id);
        await updateDoc(dishDocRef, {
          title: newTitle,
          description: newDescription,
          price: parseFloat(newPrice),
          cookTime: newCookTime,
          // Si hay imagen nueva, la guardamos, si no, no tocamos imageURL
          ...(imageURL ? { imageURL } : {}),
          updatedAt: serverTimestamp(),
        });
      } else {
        // CREACIÓN: Nuevo doc en Firestore
        await addDoc(collection(db, "dishes"), {
          title: newTitle,
          description: newDescription,
          price: parseFloat(newPrice),
          cookTime: newCookTime,
          imageURL: imageURL,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Limpiar formulario
      setNewImage("");
      setNewTitle("");
      setNewDescription("");
      setNewPrice("");
      setNewCookTime("");
      setEditingDish(null);
      setShowAddForm(false);
    } catch (error) {
      console.error("Error al guardar plato en Firestore:", error);
      Alert.alert("Error", "No se pudo guardar el plato. Revisa la consola.");
    }
  };

  // ======= 4) ELIMINAR PLATO =======
  const handleDeleteDish = (id: string) => {
    Alert.alert(
      "Eliminar plato",
      "¿Estás seguro de que deseas eliminar este plato?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "dishes", id));
            } catch (err) {
              console.error("Error eliminando plato:", err);
              Alert.alert("Error", "No se pudo eliminar el plato.");
            }
          },
        },
      ]
    );
  };

  // ======= 5) PREPARAR EDICIÓN (CARGAR DATOS) =======
  const handleEditDish = (dish: Dish) => {
    setShowAddForm(true);
    setEditingDish(dish);
    setNewTitle(dish.title);
    setNewDescription(dish.description);
    setNewPrice(dish.price.toString());
    setNewCookTime(dish.cookTime);
    // Si la imagen venía de Firestore, dish.image es { uri: ... }, 
    // no la asignamos a newImage a menos que vayamos a cambiarla.
    setNewImage("");
  };

  // ======= 6) MOSTRAR MODAL (CLIENTE) Y AGREGAR AL CARRITO =======
  const openDishModal = (dish: Dish) => {
    setSelectedDish(dish);
    setDishModalVisible(true);
    setQuantity(1);
  };

  const closeDishModal = () => {
    setDishModalVisible(false);
    setSelectedDish(null);
  };

  const incrementQuantity = () => setQuantity((q) => q + 1);
  const decrementQuantity = () => {
    if (quantity > 1) setQuantity((q) => q - 1);
  };

  // Agregar al carrito → colecc "orders"
  const handleAddToCartFromModal = async () => {
    if (selectedDish && auth.currentUser) {
      const userId = auth.currentUser.uid;
      const tableId = await AsyncStorage.getItem("userId");
      const quantityToAdd = quantity;

      // En tu código original, "image" es un require(...) o { uri: ... }. 
      // Para guardar en el pedido, no hace falta todo el "image", 
      // salvo que quieras la URL para luego mostrarlo en el carrito.
      const itemToAdd = {
        id: selectedDish.id,
        title: selectedDish.title,
        description: selectedDish.description,
        price: selectedDish.price,
        cookTime: selectedDish.cookTime,
        quantity: quantityToAdd,
        // Si deseas, también la url:
        // imageURL: selectedDish.image?.uri ?? null
      };

      try {
        const ordersCollectionRef = collection(db, "orders");
        const orderDocRef = doc(ordersCollectionRef, userId);
        const orderDocSnap = await getDoc(orderDocRef);

        if (orderDocSnap.exists()) {
          // Ya existe pedido: actualizamos array
          await updateDoc(orderDocRef, {
            items: arrayUnion(itemToAdd),
            updatedAt: new Date(),
          });
        } else {
          // Crear nuevo doc de pedido
          await setDoc(orderDocRef, { 
            userId: userId,
            tableId: tableId ?? "Mesa desconocida",
            items: [itemToAdd],
            status: "cart",
            createdAt: new Date(),
          });
        }

        Alert.alert(
          "Añadido al carrito",
          `${quantity} x ${selectedDish.title} ha(n) sido añadido(s) a tu compra.`
        );
        closeDishModal();
      } catch (error) {
        console.error("Error al guardar el pedido en Firestore:", error);
        Alert.alert(
          "Error",
          "No se pudo añadir el producto al carrito. Inténtalo de nuevo."
        );
      }
    } else {
      Alert.alert("Error", "Debes iniciar sesión para agregar productos al carrito.");
    }
  };

  // ======= 7) RENDERIZAR CADA PLATO EN PANTALLA (FLATLIST) =======
  const renderItem = ({ item }: { item: Dish }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => {
        // En ambos roles abrimos el modal; si estás en "caja", igual verás la vista previa
        openDishModal(item);
      }}
    >
      {item.image ? (
        // item.image puede ser { uri: ... } o un require(...) (placeholder)
        <Image source={item.image} style={styles.gridItemImage} />
      ) : (
        <View style={[styles.gridItemImage, styles.dishPlaceholder]}>
          <Text style={styles.placeholderText}>Sin imagen</Text>
        </View>
      )}
      <View style={styles.gridItemInfo}>
        <Text style={styles.gridItemTitle}>{item.title}</Text>
        <Text style={styles.gridItemDetail}>
          ${item.price} - {item.cookTime}
        </Text>
      </View>

      {role === "caja" && (
        <View style={styles.gridItemActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditDish(item)}
          >
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteDish(item.id)}
          >
            <Text style={styles.actionButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  // ======= 8) SI ROLE = CLIENTE =======
  if (role === "cliente") {
    return (
      <View style={[styles.container, { paddingTop: 60 }]}>
        <Text style={styles.header}>Menú</Text>
        <FlatList
          data={dishes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay platos disponibles.</Text>
          }
        />

        {/* Modal para ver detalles y añadir al carrito */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isDishModalVisible}
          onRequestClose={closeDishModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={closeDishModal}>
                <Text style={styles.closeButtonText}>X</Text>
              </TouchableOpacity>
              {selectedDish && (
                <>
                  {selectedDish.image ? (
                    <Image
                      source={selectedDish.image}
                      style={styles.modalImage}
                    />
                  ) : (
                    <View style={[styles.modalImage, styles.dishPlaceholder]}>
                      <Text style={styles.placeholderText}>Sin imagen</Text>
                    </View>
                  )}
                  <Text style={styles.modalTitle}>{selectedDish.title}</Text>
                  <Text style={styles.modalPrice}>${selectedDish.price}</Text>
                  <Text style={styles.modalDescription}>
                    {selectedDish.description}
                  </Text>

                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={decrementQuantity}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={incrementQuantity}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={handleAddToCartFromModal}
                  >
                    <Text style={styles.addToCartButtonText}>
                      Agregar - ${selectedDish.price * quantity}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ======= 9) SI ROLE = CAJA =======
  return (
    <View style={[styles.container, { paddingTop: 60 }]}>
      <Text style={styles.header}>Menú (Caja)</Text>

      {!showAddForm && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setShowAddForm(true);
            setEditingDish(null);
            setNewImage("");
            setNewTitle("");
            setNewDescription("");
            setNewPrice("");
            setNewCookTime("");
          }}
        >
          <Text style={styles.addButtonText}>Añadir nuevo plato</Text>
        </TouchableOpacity>
      )}

      {showAddForm && (
        <View style={styles.formContainer}>
          <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
            {newImage ? (
              <Image source={{ uri: newImage }} style={styles.imagePreview} />
            ) : (
              <Text style={styles.addImageText}>Añadir/Editar Imagen</Text>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Título"
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Descripción"
            value={newDescription}
            onChangeText={setNewDescription}
          />
          <TextInput
            style={styles.input}
            placeholder="Precio"
            value={newPrice}
            onChangeText={setNewPrice}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Tiempo de cocción"
            value={newCookTime}
            onChangeText={setNewCookTime}
          />
          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.saveButton} onPress={handleAddDish}>
              <Text style={styles.saveButtonText}>
                {editingDish ? "Guardar Cambios" : "Guardar"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowAddForm(false);
                setEditingDish(null);
                setNewImage("");
                setNewTitle("");
                setNewDescription("");
                setNewPrice("");
                setNewCookTime("");
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={dishes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay platos disponibles.</Text>
        }
      />
    </View>
  );
}

// ======= ESTILOS (idénticos a tu código) =======
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4", 
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  gridItem: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  gridItemImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  dishPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
  },
  placeholderText: {
    fontSize: 14,
    color: "#777",
  },
  gridItemInfo: {
    padding: 12,
  },
  gridItemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
    color: "#333",
  },
  gridItemDetail: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  gridItemActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  actionButton: {
    padding: 10,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 70,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
  editButton: {
    backgroundColor: "#f39c12",
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
  },
  addButton: {
    backgroundColor: "rgb(247, 194, 88)",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  formContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  imagePicker: {
    height: 150,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 10,
    marginBottom: 15,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  addImageText: {
    fontSize: 16,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: "#000",
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: "#27ae60",
    padding: 14,
    borderRadius: 10,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  cancelButton: {
    backgroundColor: "#e74c3c",
    padding: 14,
    borderRadius: 10,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#777",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 25,
    width: "85%",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    padding: 10,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#555",
  },
  modalImage: {
    width: 180,
    height: 180,
    resizeMode: "cover",
    borderRadius: 10,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  modalPrice: {
    fontSize: 20,
    color: "green",
    marginBottom: 15,
  },
  modalDescription: {
    fontSize: 16,
    color: "#444",
    marginBottom: 20,
    textAlign: "center",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  quantityButton: {
    backgroundColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 15,
  },
  quantityButtonText: {
    fontSize: 22,
  },
  quantityText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  addToCartButton: {
    backgroundColor: "rgb(52, 152, 219)",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  addToCartButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
});
