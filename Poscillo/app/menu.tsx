// app/menu.tsx
import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  TextInput, 
  FlatList,
  Alert 
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

// Tipos de dato para un plato (puedes ajustarlo según tus campos reales)
type Dish = {
  id: string;
  image: string;        // URL de la imagen (o base64)
  title: string;
  description: string;
  price: number;
  cookTime: string;     // Tiempo de cocción
};

type MenuScreenProps = {
  role: "cliente" | "caja";
};

export default function MenuScreen({ role }: MenuScreenProps) {
  const router = useRouter();

  // Estado que contiene la lista de platos
  const [dishes, setDishes] = useState<Dish[]>([
    {
      id: "1",
      image: "",
      title: "Hamburguesa",
      description: "Carne, queso, lechuga y tomate",
      price: 10,
      cookTime: "10 min",
    },
    {
      id: "2",
      image: "",
      title: "Pizza",
      description: "Salsa de tomate y queso mozzarella",
      price: 12,
      cookTime: "15 min",
    },
  ]);

  // Estado para manejar la creación de un nuevo plato
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCookTime, setNewCookTime] = useState("");
  const [newImage, setNewImage] = useState<string>("");

  // Abre la cámara o la galería para seleccionar una imagen
  const handlePickImage = async () => {
    try {
      // Pides permisos de cámara o galería
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "No se concedió acceso a la galería.");
        return;
      }

      // Abres la galería (o la cámara si deseas con launchCameraAsync)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length) {
        // Almacenas la URL o base64 que devuelva
        setNewImage(result.assets[0].uri);
      }
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

    const newDish: Dish = {
      id: Date.now().toString(),
      image: newImage,
      title: newTitle,
      description: newDescription,
      price: parseFloat(newPrice),
      cookTime: newCookTime,
    };

    setDishes([...dishes, newDish]);
    // Limpias el formulario
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

  // Renderiza cada plato en la lista
  const renderItem = ({ item }: { item: Dish }) => (
    <View style={styles.dishItem}>
      {/* Muestra la imagen si existe */}
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.dishImage} />
      ) : (
        <View style={[styles.dishImage, styles.dishPlaceholder]}>
          <Text style={styles.placeholderText}>Sin imagen</Text>
        </View>
      )}

      <View style={styles.dishInfo}>
        <Text style={styles.dishTitle}>{item.title}</Text>
        <Text style={styles.dishDescription}>{item.description}</Text>
        <Text style={styles.dishDetail}>Precio: ${item.price}</Text>
        <Text style={styles.dishDetail}>Tiempo: {item.cookTime}</Text>
      </View>
      {/* Botón de eliminar solo si el rol es "caja" */}
      {role === "caja" && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteDish(item.id)}
        >
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Si es cliente, mostramos directamente la lista
  if (role === "cliente") {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Menú</Text>
        <FlatList
          data={dishes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay platos disponibles.</Text>
          }
        />
      </View>
    );
  }

  // Si es caja, se muestra la lista y un botón para agregar platos
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Menú (Caja)</Text>
      {!showAddForm && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
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
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowAddForm(false);
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
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay platos disponibles.</Text>
        }
      />
    </View>
  );
}

// Estilos básicos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  dishItem: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    marginVertical: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  dishImage: {
    width: 80,
    height: 80,
    resizeMode: "cover",
  },
  dishPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
  },
  placeholderText: {
    fontSize: 12,
    color: "#999",
  },
  dishInfo: {
    flex: 1,
    padding: 8,
  },
  dishTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  dishDescription: {
    fontSize: 14,
    color: "#666",
  },
  dishDetail: {
    fontSize: 14,
    marginTop: 2,
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  addButton: {
    backgroundColor: "#9b59b6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  formContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  imagePicker: {
    height: 120,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 8,
    marginBottom: 12,
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
    fontSize: 14,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    color: "#000",
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveButton: {
    backgroundColor: "#27ae60",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 4,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#e74c3c",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 4,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 16,
    color: "#666",
  },
});
