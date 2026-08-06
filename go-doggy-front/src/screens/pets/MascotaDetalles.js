import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { styles } from "./styles/MascotaDetallesStyles";
import { API_URL } from "../../utils/api";

export default function MascotaDetalles({ route, navigation }) {
  const { mascota } = route.params;
  const [showConfirm, setShowConfirm] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null);
  const tipoMascota = mascota.tipo_mascota || mascota.tipoMascota || "Sin registro";

  const regresar = () => navigation.goBack();

  const editarMascota = () => {
    navigation.navigate("EditarMascota", { mascota });
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "Sin registro";
    const iso = fecha.toString().split("T")[0];
    return iso;
  };

  const formatEsterilizado = (valor) => {
    if (typeof valor === "boolean") return valor ? "Sí" : "No";
    const texto = String(valor || "").trim().toLowerCase();
    return texto === "si" || texto === "sí" || texto === "true"
      ? "Sí"
      : "No";
  };

  const detalleMascota = [
    { label: "Tipo de Mascota", value: tipoMascota },
    { label: "Nombre", value: mascota.nombre },
    { label: "Raza", value: mascota.raza },
    { label: "Color", value: mascota.color },
    { label: "Sexo", value: mascota.sexo },
    {
      label: "Fecha de Nacimiento",
      value: formatFecha(mascota.fecha_nacimiento),
    },
    { label: "Peso", value: mascota.peso_kg ? `${mascota.peso_kg} kg` : "Sin registro" },
    { label: "Esterilizado", value: formatEsterilizado(mascota.esterilizado) },
    { label: "Miedos", value: mascota.miedos || "Ninguno" },
    { label: "Alergias", value: mascota.alergias || "Ninguna" },
    { label: "Número de Patas", value: mascota.num_patas ?? "Sin registro" },
    {
      label: "Notas de Comportamiento",
      value: mascota.notas_comportamiento || "Ninguna",
    },
  ];

  const eliminarMascota = () => {
    console.log("🐶 Mascota completa:", JSON.stringify(mascota, null, 2));
    console.log(
      "🆔 ID a eliminar:",
      mascota.mascota_id,
      "Tipo:",
      typeof mascota.mascota_id,
    );

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
      const url = `${API_URL}/mascota/${mascota.mascota_id}`;
      console.log("🌐 URL completa:", url);

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
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
        alert(
          `Error ${response.status}: ${data.message || "Error desconocido"}`,
        );
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
          source={
            mascota.url_foto
              ? { uri: `${API_URL}/uploads/${mascota.url_foto}` }
              : require("../../../assets/perro1.jpg")
          }
          style={styles.petImage}
        />

        <Text style={styles.petName}>{mascota.nombre}</Text>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Detalles de la mascota</Text>
          {detalleMascota.map((detalle) => (
            <View key={detalle.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{detalle.label}:</Text>
              <Text style={styles.detailValue}>{detalle.value || "Sin registro"}</Text>
            </View>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.editButton} onPress={editarMascota}>
            <Text style={styles.buttonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={eliminarMascota}
          >
            <Text style={styles.buttonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomTab}>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(0)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(0)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("Inicio_cliente")}
        >
          {hoveredTab === 0 && <Text style={styles.tabLabel}>Inicio</Text>}
          <Image
            source={require("../../../assets/casa.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(1)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(1)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("Servicio_Cliente_Inicio")}
        >
          {hoveredTab === 1 && <Text style={styles.tabLabel}>Servicio</Text>}
          <Image
            source={require("../../../assets/puntos.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(2)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(2)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("MapaCliente")}
        >
          {hoveredTab === 2 && <Text style={styles.tabLabel}>Mapa</Text>}
          <Image
            source={require("../../../assets/maps.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(3)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(3)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("NotificacionesCliente")}
        >
          {hoveredTab === 3 && (
            <Text style={styles.tabLabel}>Notificaciones</Text>
          )}
          <Image
            source={require("../../../assets/Notificaciones.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
      </View>

      {showConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirmar eliminación</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que quieres eliminar a {mascota.nombre}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.buttonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
