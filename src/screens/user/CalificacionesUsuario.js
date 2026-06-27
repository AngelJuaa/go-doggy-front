import React, { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { s, vs, ms } from "../../utils/responsive";
import storage from "../../utils/storage";
import { apiFetch } from "../../utils/api";

export default function CalificacionesUsuario({ navigation }) {
  const [esPaseador, setEsPaseador]     = useState(false);
  const [usuarioId, setUsuarioId]       = useState(null);
  const [calificaciones, setCalificaciones] = useState([]);
  const [loading, setLoading]           = useState(true);

  useFocusEffect(
    useCallback(() => {
      const u = JSON.parse(storage.getItem("usuario") || "{}");
      if (!u.usuario_id) return;
      const esPas = !!u.es_paseador;
      setEsPaseador(esPas);
      setUsuarioId(u.usuario_id);

      const endpoint = esPas
        ? `/calificaciones/${u.usuario_id}`
        : `/calificaciones/dadas/${u.usuario_id}`;

      setLoading(true);
      apiFetch(endpoint)
        .then(data => setCalificaciones(data || []))
        .catch(() => setCalificaciones([]))
        .finally(() => setLoading(false));
    }, [])
  );

  const renderStars = (valor) =>
    [1, 2, 3, 4, 5].map(n => (
      <Text key={n} style={[styles.star, { color: n <= valor ? "#FFD700" : "#ddd" }]}>★</Text>
    ));

  const formatFecha = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("es-MX", {
      day: "2-digit", month: "long", year: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image source={require("../../../assets/puntos.png")} style={styles.headerIcon} />
        <View style={styles.titleBox}>
          <Text style={styles.titleText}>Calificaciones</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>↩</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        {esPaseador ? "Calificaciones recibidas" : "Calificaciones dadas"}
      </Text>
      <View style={styles.divider} />

      {loading ? (
        <ActivityIndicator size="large" color="#99D9C1" style={{ marginTop: vs(40) }} />
      ) : calificaciones.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>⭐</Text>
          <Text style={styles.emptyText}>
            {esPaseador
              ? "Aún no tienes calificaciones recibidas."
              : "Aún no has calificado ningún paseo."}
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.list}>
          {calificaciones.map((item) => (
            <View key={item.calificacion_id} style={styles.card}>
              {/* Nombre principal */}
              <Text style={styles.nombre}>
                {esPaseador
                  ? `👤 ${item.cliente_nombre || "Cliente"}`
                  : `🐾 ${item.paseador_nombre || "Paseador"}`}
              </Text>

              {/* Mascota + tipo */}
              <Text style={styles.subInfo}>
                {item.mascota_nombre ? `🐶 ${item.mascota_nombre}` : "🐶 Sin mascota"}
                {item.tipo_servicio ? `  ·  ${item.tipo_servicio}` : ""}
              </Text>

              {/* Fecha */}
              <Text style={styles.fecha}>{formatFecha(item.fecha_calificacion)}</Text>

              {/* Estrellas */}
              <View style={styles.starsRow}>
                {renderStars(item.valor_calificacion)}
                <Text style={styles.valorText}>{item.valor_calificacion}/5</Text>
              </View>

              {/* Comentario */}
              {!!item.comentario && (
                <Text style={styles.comentario}>"{item.comentario}"</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* BOTTOM TAB */}
      {esPaseador ? (
        <View style={styles.bottomTab}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("Inicio_paseador")}>
            <Text style={styles.tabIcon}>🏠</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("PaseosPaseador")}>
            <Text style={styles.tabIcon}>✅</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("NotificacionesUsuario")}>
            <Text style={styles.tabIcon}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("PerfilPaseador")}>
            <Text style={styles.tabIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bottomTab}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("Inicio_cliente")}>
            <Image source={require("../../../assets/casa.png")} style={styles.tabImg} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("Servicio_Cliente_Inicio")}>
            <Image source={require("../../../assets/puntos.png")} style={styles.tabImg} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("MapaCliente")}>
            <Image source={require("../../../assets/maps.png")} style={styles.tabImg} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("NotificacionesUsuario")}>
            <Image source={require("../../../assets/Notificaciones.png")} style={styles.tabImg} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, height: "100vh", backgroundColor: "#F5F5F0" },
  header:      { flexDirection: "row", alignItems: "center", padding: s(18), paddingTop: vs(50) },
  headerIcon:  { width: s(38), height: s(38), resizeMode: "contain", marginRight: s(14) },
  titleBox:    { flex: 1, backgroundColor: "#FFF9E6", paddingHorizontal: s(22), paddingVertical: vs(7), borderRadius: s(20) },
  titleText:   { fontSize: ms(20), fontWeight: "bold" },
  backIcon:    { fontSize: ms(26) },
  sectionTitle:{ fontSize: ms(16), fontWeight: "bold", marginLeft: s(18), marginTop: vs(12) },
  divider:     { height: 2, backgroundColor: "#000", marginHorizontal: s(18), marginTop: vs(4), marginBottom: vs(8) },

  emptyWrap:   { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: vs(60) },
  emptyIcon:   { fontSize: ms(48), marginBottom: vs(12) },
  emptyText:   { fontSize: ms(14), color: "#888", textAlign: "center", paddingHorizontal: s(30) },

  list:        { padding: s(16), paddingBottom: vs(20) },
  card:        {
    backgroundColor: "#fff",
    borderRadius: s(14),
    padding: s(16),
    marginBottom: vs(12),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  nombre:      { fontSize: ms(15), fontWeight: "bold", color: "#333", marginBottom: vs(4) },
  subInfo:     { fontSize: ms(12), color: "#666", marginBottom: vs(4) },
  fecha:       { fontSize: ms(12), color: "#999", marginBottom: vs(8) },
  starsRow:    { flexDirection: "row", alignItems: "center", marginBottom: vs(6) },
  star:        { fontSize: ms(20), marginRight: s(2) },
  valorText:   { fontSize: ms(12), color: "#888", marginLeft: s(6), fontWeight: "600" },
  comentario:  { fontSize: ms(13), color: "#555", fontStyle: "italic", backgroundColor: "#FFFDE7", borderRadius: s(8), padding: s(8) },

  bottomTab:   { flexDirection: "row", backgroundColor: "#99D9C1", height: vs(65), justifyContent: "space-around", alignItems: "center" },
  tabItem:     { flex: 1, alignItems: "center", justifyContent: "center" },
  tabIcon:     { fontSize: ms(22) },
  tabImg:      { width: s(38), height: s(38), resizeMode: "contain" },
});
