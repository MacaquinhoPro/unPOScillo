import React, { useState, useEffect } from "react";
import { View,Text, TouchableOpacity, StyleSheet, Image, TextInput, FlatList, Alert, Modal,} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { CameraType, useCameraPermissions } from "expo-camera";
import { db, auth, storage } from "../../utils/firebaseconfig";
import {collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, arrayUnion, setDoc, getDoc,} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type Dish = {
  id: string;
  image: any;       
  title: string;
  description: string;
  price: number;
  cookTime: string;
  quantity?: number; 
};

type MenuScreenProps = {
  role: "cliente" | "caja";
};

export default function MenuScreen({ role }: MenuScreenProps) {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();

  const [dishes, setDishes] = useState<Dish[]>([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCookTime, setNewCookTime] = useState("");
  const [newImage, setNewImage] = useState<string>(""); 
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  const [isDishModalVisible, setDishModalVisible] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const dishesRef = collection(db, "dishes");
    const q = query(dishesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedDishes: Dish[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          image: data.imageURL
            ? { uri: data.imageURL }
            : require("../../assets/images/Ensalada.png"), 
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

  const handleAddDish = async () => {
    if (!newTitle.trim() || !newPrice.trim() || !newCookTime.trim()) {
      Alert.alert("Campos incompletos", "Todos los campos son obligatorios.");
      return;
    }

    try {
      let imageURL = "";

      if (newImage) {
        const fileRef = ref(storage, `dishImages/${Date.now()}`);
        const resp = await fetch(newImage);
        const blob = await resp.blob();
        await uploadBytes(fileRef, blob);
        imageURL = await getDownloadURL(fileRef);
      }

      if (editingDish) {
        const dishDocRef = doc(db, "dishes", editingDish.id);
        await updateDoc(dishDocRef, {
          title: newTitle,
          description: newDescription,
          price: parseFloat(newPrice),
          cookTime: newCookTime,
          ...(imageURL ? { imageURL } : {}),
          updatedAt: serverTimestamp(),
        });
      } else {
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

  const handleEditDish = (dish: Dish) => {
    setShowAddForm(true);
    setEditingDish(dish);
    setNewTitle(dish.title);
    setNewDescription(dish.description);
    setNewPrice(dish.price.toString());
    setNewCookTime(dish.cookTime);
    setNewImage("");
  };

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

  const handleAddToCartFromModal = async () => {
    if (selectedDish && auth.currentUser) {
      const userId = auth.currentUser.uid;
      const quantityToAdd = quantity;
      const itemToAdd = {
        id: selectedDish.id,
        title: selectedDish.title,
        description: selectedDish.description,
        price: selectedDish.price,
        cookTime: selectedDish.cookTime,
        quantity: quantityToAdd,
      };

      try {
        const ordersCollectionRef = collection(db, "orders");
        const orderDocRef = doc(ordersCollectionRef, userId);
        const orderDocSnap = await getDoc(orderDocRef);

        if (
          orderDocSnap.exists() &&
          orderDocSnap.data()?.status === "cart"
        ) {
          await updateDoc(orderDocRef, {
            items: arrayUnion(itemToAdd),
            updatedAt: new Date(),
          });
        } else {
          await setDoc(orderDocRef, {
            userId: userId,
            tableId: "Sin Asignar",
            items: [itemToAdd],
            status: "cart",
            createdAt: new Date(),
          });
        }

        Alert.alert(
          "Añadido al carrito",
          `${quantityToAdd} x ${selectedDish.title} ha(n) sido añadido(s) a tu compra.`
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

  const renderItem = ({ item }: { item: Dish }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={
        role === "cliente"
          ? () => openDishModal(item)
          : () => handleEditDish(item)
      }
    >
      {item.image ? (
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
            {editingDish && (
              <TouchableOpacity
                style={styles.deleteButtonForm}
                onPress={() => handleDeleteDish(editingDish.id)}
              >
                <Text style={styles.deleteButtonFormText}>Eliminar</Text>
              </TouchableOpacity>
            )}
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
    marginRight: 4,
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
    marginLeft: 4,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  deleteButtonForm: {
    backgroundColor: "#e74c3c",
    padding: 14,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  deleteButtonFormText: {
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
