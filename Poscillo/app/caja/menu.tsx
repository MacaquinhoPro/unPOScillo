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
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { db, auth } from "../../utils/firebaseconfig"; // Asegúrate de que la ruta sea correcta
import { collection, doc, setDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

type Dish = {
  id: string;
  image: any; // Cambiado a any para aceptar el objeto de require()
  title: string;
  description: string;
  price: number;
  cookTime: string;
};

type MenuScreenProps = {
  role: "cliente" | "caja";
};

export default function MenuScreen({ role }: MenuScreenProps) {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();

  const [dishes, setDishes] = useState<Dish[]>([
    {
      id: "1",
      image: require("../../assets/images/Hamburguesa.png"), // Ajusta la ruta si tu estructura de carpetas es diferente
      title: "Hamburguesa",
      description: "Carne, queso, lechuga y tomate",
      price: 10,
      cookTime: "10 min",
    },
    {
      id: "2",
      image: require("../../assets/images/pizza.png"), // Ajusta la ruta si tu estructura de carpetas es diferente
      title: "Pizza",
      description: "Salsa de tomate y queso mozzarella",
      price: 12,
      cookTime: "15 min",
    },
    {
      id: "3",
      image: require("../../assets/images/sushi.png"), // Ajusta la ruta si tu estructura de carpetas es diferente
      title: "Sushi",
      description: "Variedad de sushi fresco",
      price: 15,
      cookTime: "20 min",
    },
    {
      id: "4",
      image: require("../../assets/images/tacos.png"), // Ajusta la ruta si tu estructura de carpetas es diferente
      title: "Tacos",
      description: "Tortillas de maíz con carne y salsa",
      price: 8,
      cookTime: "12 min",
    },
    {
      id: "5",
      image: require("../../assets/images/Ensalada.png"), // Ajusta la ruta si tu estructura de carpetas es diferente
      title: "Ensalada",
      description: "Mezcla de verduras frescas",
      price: 7,
      cookTime: "5 min",
    },
    {
      id: "6",
      image: require("../../assets/images/pasta.png"), // Ajusta la ruta si tu estructura de carpetas es diferente
      title: "Pasta",
      description: "Pasta con salsa boloñesa",
      price: 11,
      cookTime: "18 min",
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCookTime, setNewCookTime] = useState("");
  const [newImage, setNewImage] = useState<string>("");
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [purchaseItems, setPurchaseItems] = useState<Dish[]>([]);

  // Estados para la ventana emergente de detalles del plato
  const [isDishModalVisible, setDishModalVisible] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [quantity, setQuantity] = useState(1); // Estado para la cantidad

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

  const handleAddDish = () => {
    if (!newTitle.trim() || !newPrice.trim() || !newCookTime.trim()) {
      Alert.alert("Campos incompletos", "Todos los campos son obligatorios.");
      return;
    }

    if (editingDish) {
      const updatedDishes = dishes.map((dish) =>
        dish.id === editingDish.id
          ? {
              ...dish,
              image: newImage || dish.image, // Conserva la imagen anterior si no se seleccionó una nueva
              title: newTitle,
              description: newDescription,
              price: parseFloat(newPrice),
              cookTime: newCookTime,
            }
          : dish
      );
      setDishes(updatedDishes);
      setEditingDish(null);
    } else {
      const newDish: Dish = {
        id: Date.now().toString(),
        image: newImage,
        title: newTitle,
        description: newDescription,
        price: parseFloat(newPrice),
        cookTime: newCookTime,
      };
      setDishes([...dishes, newDish]);
    }

    setNewImage("");
    setNewTitle("");
    setNewDescription("");
    setNewPrice("");
    setNewCookTime("");
    setShowAddForm(false);
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
          onPress: () => {
            setDishes(dishes.filter((dish) => dish.id !== id));
          },
        },
      ]
    );
  };

  const handleEditDish = (dish: Dish) => {
    setShowAddForm(true);
    setEditingDish(dish);
    // Si la imagen original era un objeto de require(), no intentes asignarlo directamente a newImage (que espera una URI)
    // En este caso, al editar, la imagen existente se mantendrá hasta que se seleccione una nueva.
    setNewTitle(dish.title);
    setNewDescription(dish.description);
    setNewPrice(dish.price.toString());
    setNewCookTime(dish.cookTime);
  };

  const openDishModal = (dish: Dish) => {
    setSelectedDish(dish);
    setDishModalVisible(true);
    setQuantity(1); // Resetear la cantidad al abrir el modal
  };

  const closeDishModal = () => {
    setDishModalVisible(false);
    setSelectedDish(null);
  };

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCartFromModal = async () => {
    if (selectedDish && auth.currentUser) {
      const userId = auth.currentUser.uid;
      const quantityToAdd = quantity;
      const itemToAdd = { ...selectedDish, quantity: quantityToAdd }; // Incluye la cantidad en el item

      try {
        const ordersCollectionRef = collection(db, "orders");
        const orderDocRef = doc(ordersCollectionRef, userId); // Usamos el UID del cliente como ID del documento para facilitar la consulta

        // Verificamos si ya existe un pedido pendiente para este usuario
        const orderDocSnap = await getDoc(orderDocRef);

        if (orderDocSnap.exists()) {
          // Si existe, actualizamos el array de items
          await updateDoc(orderDocRef, {
            items: arrayUnion(itemToAdd),
            updatedAt: new Date(),
          });
        } else {
          // Si no existe, creamos un nuevo documento de pedido
          await setDoc(orderDocRef, {
            userId: userId,
            items: [itemToAdd],
            status: "pending", // Estado inicial del pedido
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
        Alert.alert("Error", "No se pudo añadir el producto al carrito. Inténtalo de nuevo.");
      }
    } else {
      Alert.alert("Error", "Debes iniciar sesión para agregar productos al carrito.");
    }
  };

  const renderItem = ({ item }: { item: Dish }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => {
        openDishModal(item); // Abrir la ventana emergente al hacer clic para ambos roles
      }}
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
        <Text style={styles.gridItemDetail}>${item.price} - {item.cookTime}</Text>
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
      <View style={[styles.container, { paddingTop: 60 }]}> {/* Añadido paddingTop */}
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
                  <Text style={styles.modalDescription}>{selectedDish.description}</Text>

                  <View style={styles.quantityContainer}>
                    <TouchableOpacity style={styles.quantityButton} onPress={decrementQuantity}>
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity style={styles.quantityButton} onPress={incrementQuantity}>
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCartFromModal}>
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
    <View style={[styles.container, { paddingTop: 60 }]}> {/* Añadido paddingTop */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4", // Un fondo gris claro
    padding: 16,
  },
  header: {
    fontSize: 24, // Aumentar el tamaño del header
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333", // Color de texto más oscuro
  },
  gridItem: {
    flex: 1,
    margin: 8,
    borderRadius: 12, // Bordes más redondeados
    overflow: "hidden",
    backgroundColor: "#fff", // Fondo blanco para cada item
    elevation: 5, // Sombra más pronunciada para Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  gridItemImage: {
    width: "100%",
    height: 150, // Aumentar la altura de la imagen
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
    fontSize: 18, // Aumentar tamaño del título
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
    color: "#333",
  },
  gridItemDetail: {
    fontSize: 16, // Aumentar tamaño del detalle
    color: "#666",
    textAlign: "center",
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
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
    backgroundColor: "#fff", // Fondo blanco para el formulario
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  imagePicker: {
    height: 150, // Aumentar altura del selector de imagen
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
    backgroundColor: "#f9f9f9", // Fondo ligero para los inputs
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
  addButtonToPurchaseGrid: {
    backgroundColor: "#27ae60",
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    margin: 10,
  },
  addButtonToPurchaseText: {
    color: "#fff",
    fontSize: 16,
  },
  viewPurchaseButton: {
    backgroundColor: "rgb(52, 152, 219)",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  viewPurchaseButtonText: {
    color: "#fff",
    fontSize: 18,
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
    width: 180, // Aumentar tamaño de la imagen en el modal
    height: 180,
    resizeMode: "cover",
    borderRadius: 10,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22, // Aumentar tamaño del título en el modal
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  modalPrice: {
    fontSize: 20, // Aumentar tamaño del precio en el modal
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