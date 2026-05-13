import React, { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from "react-native";
import { styles } from "./MascotaDetallesStyles";

export default function MascotaDetalles({ route, navigation }) {
  const { mascota } = route.params;
  const [showConfirm, setShowConfirm] = useState(false);

  const regresar = () => navigation.goBack();

  const editarMascota = () => {
    navigation.navigate("EditarMascota", { mascota });
  };

const eliminarMascota = () => {
  console.log("🐶 Mascota completa:", JSON.stringify(mascota, null, 2));
  console.log("🆔 ID a eliminar:", mascota.mascota_id, "Tipo:", typeof mascota.mascota_id);

  if (!mascota.mascota_id) {
    Alert.alert("Error", "ID de mascota inválido o no encontrado");
    return;
  }

  console.log("🚨 Mostrando modal de confirmación...");
  setShowConfirm(true);
};

const handleConfirmDelete = async () => {
  setShowConfirm(false);
  try {
    const url = `http://localhost:3000/mascota/${mascota.mascota_id}`;
    console.log("🌐 URL completa:", url);

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("📡 Status HTTP:", response.status);
    console.log("📡 Headers:", response.headers);

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
      console.log("📡 Respuesta JSON:", data);
    } catch (jsonError) {
      console.log("📡 Respuesta no es JSON:", text);
      data = { message: text || "Respuesta no válida" };
    }

    if (response.ok) {
      alert("Éxito: Mascota eliminada correctamente");
      navigation.goBack();
    } else {
      alert(`Error ${response.status}: ${data.message || "Error desconocido"}`);
    }

  } catch (error) {
    console.error("❌ Error de red:", error);
    alert(`Error de conexión: ${error.message}`);
  }
};

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={regresar} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={mascota.url_foto ? { uri: `http://localhost:3000/uploads/${mascota.url_foto}` } : require("../../../assets/perro1.jpg")}
          style={styles.petImage}
        />

        <Text style={styles.petName}>{mascota.nombre}</Text>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Raza:</Text>
          <Text style={styles.detailValue}>{mascota.raza}</Text>

          <Text style={styles.detailLabel}>Color:</Text>
          <Text style={styles.detailValue}>{mascota.color}</Text>

          <Text style={styles.detailLabel}>Sexo:</Text>
          <Text style={styles.detailValue}>{mascota.sexo}</Text>

          <Text style={styles.detailLabel}>Fecha de Nacimiento:</Text>
          <Text style={styles.detailValue}>{mascota.fecha_nacimiento}</Text>

          <Text style={styles.detailLabel}>Peso:</Text>
          <Text style={styles.detailValue}>{mascota.peso_kg} kg</Text>

          <Text style={styles.detailLabel}>Esterilizado:</Text>
          <Text style={styles.detailValue}>{mascota.esterilizado ? "Sí" : "No"}</Text>

          <Text style={styles.detailLabel}>Miedos:</Text>
          <Text style={styles.detailValue}>{mascota.miedos || "Ninguno"}</Text>

          <Text style={styles.detailLabel}>Alérgias:</Text>
          <Text style={styles.detailValue}>{mascota.alergias || "Ninguna"}</Text>

          <Text style={styles.detailLabel}>Número de Patas:</Text>
          <Text style={styles.detailValue}>{mascota.num_patas}</Text>

          <Text style={styles.detailLabel}>Notas de Comportamiento:</Text>
          <Text style={styles.detailValue}>{mascota.notas_comportamiento || "Ninguna"}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.editButton} onPress={editarMascota}>
            <Text style={styles.buttonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={eliminarMascota}>
            <Text style={styles.buttonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirmar eliminación</Text>
            <Text style={styles.modalMessage}>¿Estás seguro de que quieres eliminar a {mascota.nombre}?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowConfirm(false)}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmDelete}>
                <Text style={styles.buttonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}