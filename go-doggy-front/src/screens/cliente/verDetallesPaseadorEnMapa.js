import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { styles } from "./verDetallesPaseadorEnMapaStyle";
import { API_URL } from "../../utils/api";

export default function VerDetallesPaseadorEnMapa({ route, navigation }) {
  const { paseador } = route?.params || {};
  const [hoveredTab, setHoveredTab] = useState(null);
  const [reseñas, setReseñas] = useState([]);
  const [cargandoReseñas, setCargandoReseñas] = useState(true);
  const nombreCompleto = `${paseador?.nombre || "Paseador"}${paseador?.apellido ? ` ${paseador.apellido}` : ""}`;
  const promedioEstrellas = reseñas.length
    ? reseñas.reduce((total, reseña) => total + (Number(reseña.promedio) || 0), 0) / reseñas.length
    : 0;

  useEffect(() => {
    const paseadorId = Number(paseador?.paseador_id || paseador?.usuario_id || paseador?.id || 0);
    if (!paseadorId) {
      setCargandoReseñas(false);
      return;
    }
    fetch(`${API_URL}/paseador/${paseadorId}/calificaciones`)
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setReseñas(Array.isArray(data) ? data : []))
      .catch(() => setReseñas([]))
      .finally(() => setCargandoReseñas(false));
  }, [paseador?.paseador_id, paseador?.usuario_id, paseador?.id]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Regresar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Detalles del paseador</Text>

        <View style={styles.card}>
          <Image
            source={
              paseador?.url_foto_perfil
                ? { uri: `${API_URL}/uploads/${paseador.url_foto_perfil}` }
                : require("../../../assets/perfil.png")
            }
            style={styles.photo}
          />
          <Text style={styles.name}>{nombreCompleto}</Text>
          <View style={styles.averageRating}>
            <Text style={styles.averageStars}>
              {"★".repeat(Math.round(promedioEstrellas))}{"☆".repeat(Math.max(0, 5 - Math.round(promedioEstrellas)))}
            </Text>
            <Text style={styles.averageScore}>{promedioEstrellas.toFixed(1)} / 5</Text>
          </View>

          <View style={styles.detailGroup}>
            <Text style={styles.label}>Biografía</Text>
            <Text style={styles.value}>{paseador?.biografia || "Sin biografía disponible."}</Text>
          </View>

          <View style={styles.detailGroup}>
            <Text style={styles.label}>Reseñas</Text>
            {cargandoReseñas ? <ActivityIndicator color="#1F4D36" /> : reseñas.length === 0 ? (
              <Text style={styles.value}>Aún no tiene reseñas.</Text>
            ) : reseñas.map((reseña) => (
              <View key={`${reseña.servicio_id}-${reseña.califica_usuario_id}`} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewClient}>{reseña.cliente_nombre || "Cliente"}</Text>
                  <Text style={styles.reviewStars}>{"★".repeat(Math.round(Number(reseña.promedio) || 0))}</Text>
                </View>
                <Text style={styles.reviewScore}>{Number(reseña.promedio || 0).toFixed(1)} / 5</Text>
                {reseña.comentario ? <Text style={styles.reviewComment}>{reseña.comentario}</Text> : null}
              </View>
            ))}
          </View>
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
          <Image source={require("../../../assets/casa.png")} style={styles.tabIconImg} />
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
          <Image source={require("../../../assets/puntos.png")} style={styles.tabIconImg} />
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
          <Image source={require("../../../assets/maps.png")} style={styles.tabIconImg} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(3)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(3)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("NotificacionesCliente")}
        >
          {hoveredTab === 3 && <Text style={styles.tabLabel}>Notificaciones</Text>}
          <Image source={require("../../../assets/Notificaciones.png")} style={styles.tabIconImg} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
