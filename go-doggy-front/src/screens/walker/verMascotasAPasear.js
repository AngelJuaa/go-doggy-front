import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { styles } from "./verMascotasAPasearStyle";
import { API_URL, apiFetch } from "../../utils/api";

export default function VerMascotasAPasear({ route, navigation }) {
  const servicioId = Number(route?.params?.servicioId || 0);
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarMascotas = async () => {
      if (!servicioId) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch(`/servicio/${servicioId}/mascotas`);
        setMascotas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.warn("No se pudieron cargar las mascotas del servicio:", error);
        setMascotas([]);
      } finally {
        setLoading(false);
      }
    };

    cargarMascotas();
  }, [servicioId]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Regresar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Mascotas a pasear</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2E7D4F" style={styles.loader} />
        ) : mascotas.length === 0 ? (
          <Text style={styles.emptyText}>No hay mascotas asociadas a este servicio.</Text>
        ) : (
          mascotas.map((mascota) => (
            <View key={mascota.mascota_id} style={styles.card}>
              <Image
                source={mascota.url_foto ? { uri: `${API_URL}/uploads/${mascota.url_foto}` } : require("../../../assets/perro1.jpg")}
                style={styles.photo}
              />
              <Text style={styles.name}>{mascota.nombre || "Mascota"}</Text>
              <View style={styles.detailGroup}>
                <Text style={styles.label}>Alergias</Text>
                <Text style={styles.value}>{mascota.alergias || "Ninguna"}</Text>
              </View>
              <View style={styles.detailGroup}>
                <Text style={styles.label}>Miedos</Text>
                <Text style={styles.value}>{mascota.miedos || "Ninguno"}</Text>
              </View>
              {mascota.notas_comportamiento ? (
                <View style={styles.detailGroup}>
                  <Text style={styles.label}>Notas</Text>
                  <Text style={styles.value}>{mascota.notas_comportamiento}</Text>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("InicioPaseador")}>
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={styles.tabLabel}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("PaseosPaseador")}>
          <Text style={styles.tabIcon}>✅</Text>
          <Text style={styles.tabLabel}>Paseos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("NotificacionesPaseador")}>
          <Text style={styles.tabIcon}>🔔</Text>
          <Text style={styles.tabLabel}>Notificaciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("PerfilPaseador")}>
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={styles.tabLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
