import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { s, vs, ms } from "../../utils/responsive";
import { apiFetch } from "../../utils/api";
import storage from "../../utils/storage";

const ESTADO_LABEL = {
  creado:     "⏳ Pendiente",
  en_camino:  "🚶 En camino",
  activo:     "🐾 En curso",
  completado: "✅ Completado",
  cancelado:  "❌ Cancelado",
};
const ESTADO_COLOR = {
  creado:     "#FFA500",
  en_camino:  "#007bff",
  activo:     "#28a745",
  completado: "#22a06b",
  cancelado:  "#dc3545",
};

export default function PaseosPaseador({ navigation }) {
  const [paseos, setPaseos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("Todos");

  useFocusEffect(
    useCallback(() => {
      const u = JSON.parse(storage.getItem("usuario") || "{}");
      if (u.usuario_id) cargar(u.usuario_id);
    }, [])
  );

  const cargar = async (id) => {
    try {
      const data = await apiFetch(`/servicios/paseador/${id}`);
      setPaseos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtrados = paseos.filter((p) => {
    if (filtro === "Completados") return p.estado === "completado";
    if (filtro === "Activos")    return ["creado", "en_camino", "activo"].includes(p.estado);
    return true;
  });

  const gananciasTotal = paseos
    .filter((p) => p.estado === "completado")
    .reduce((sum, p) => sum + parseFloat(p.costo_total || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>↩</Text>
        </TouchableOpacity>
        <Text style={styles.title}>✅ Mis paseos</Text>
        <View />
      </View>

      {!loading && (
        <View style={styles.gananciasHeader}>
          <Text style={styles.gananciasLabel}>Ganancias totales</Text>
          <Text style={styles.gananciasValor}>${gananciasTotal.toFixed(2)} MXN</Text>
        </View>
      )}

      {/* FILTROS */}
      <View style={styles.filtroRow}>
        {["Todos", "Completados", "Activos"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filtroChip, filtro === f && styles.filtroSelected]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.filtroText, filtro === f && styles.filtroTextSelected]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#99D9C1" style={{ marginTop: vs(40) }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {filtrados.length === 0 ? (
            <Text style={styles.empty}>No hay paseos en esta categoría.</Text>
          ) : (
            filtrados.map((p) => (
              <View key={p.servicio_id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.mascota}>🐶 {p.mascota_nombre}</Text>
                  <View style={[styles.badge, { backgroundColor: ESTADO_COLOR[p.estado] || "#999" }]}>
                    <Text style={styles.badgeText}>{ESTADO_LABEL[p.estado] || p.estado}</Text>
                  </View>
                </View>
                <Text style={styles.detail}>Dueño: {p.dueno_nombre}</Text>
                <Text style={styles.detail}>Tipo: {p.tipo_servicio} · {p.duracion_minutos} min</Text>
                <Text style={styles.detail}>
                  Fecha: {new Date(p.hora_solicitada).toLocaleDateString("es-MX", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </Text>
                {p.estado === "completado" && parseFloat(p.costo_total || 0) > 0 && (
                  <View style={styles.costoRow}>
                    <Text style={styles.costoText}>💰 ${parseFloat(p.costo_total).toFixed(2)} MXN</Text>
                    <Text style={styles.metodoText}>{p.metodo_pago || "Efectivo"}</Text>
                  </View>
                )}
                {p.estado === "completado" && (
                  <TouchableOpacity
                    style={styles.rutaBtn}
                    onPress={() => navigation.navigate("RutaPaseo", { servicioId: p.servicio_id })}
                  >
                    <Text style={styles.rutaBtnText}>🗺️ Ver ruta</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("Inicio_paseador")}>
          <Text style={styles.tabIcon}>🏠</Text><Text style={styles.tabLabel}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => {}}>
          <Text style={styles.tabIcon}>✅</Text><Text style={styles.tabLabel}>Paseos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("NotificacionesUsuario")}>
          <Text style={styles.tabIcon}>🔔</Text><Text style={styles.tabLabel}>Notificaciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("PerfilPaseador")}>
          <Text style={styles.tabIcon}>👤</Text><Text style={styles.tabLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: s(20), paddingTop: vs(50), paddingBottom: vs(10), backgroundColor: "#fff" },
  back: { fontSize: ms(24) },
  title: { fontSize: ms(17), fontWeight: "bold", color: "#333" },
  filtroRow:          { flexDirection: "row", padding: s(12), gap: s(8), backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  filtroChip:         { paddingHorizontal: s(16), paddingVertical: vs(6), borderRadius: s(20), backgroundColor: "#f0f0f0" },
  filtroSelected:     { backgroundColor: "#99D9C1" },
  filtroText:         { fontSize: ms(13), color: "#555", fontWeight: "600" },
  filtroTextSelected: { color: "#fff" },
  content: { padding: s(16), paddingBottom: vs(40) },
  empty: { textAlign: "center", color: "#999", marginTop: vs(40), fontSize: ms(14) },
  card: { backgroundColor: "#fff", borderRadius: s(14), padding: s(16), marginBottom: vs(12), elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: vs(8) },
  mascota: { fontSize: ms(16), fontWeight: "bold", color: "#333" },
  badge: { paddingHorizontal: s(10), paddingVertical: vs(3), borderRadius: s(10) },
  badgeText: { color: "#fff", fontSize: ms(10), fontWeight: "bold" },
  detail: { fontSize: ms(12), color: "#666", marginBottom: vs(3) },
  rutaBtn: { backgroundColor: "#99D9C1", borderRadius: s(10), padding: s(8), alignItems: "center", marginTop: vs(8) },
  rutaBtnText: { color: "#fff", fontWeight: "bold", fontSize: ms(12) },
  gananciasHeader: { backgroundColor: "#EDF9F4", marginHorizontal: s(16), marginTop: vs(10), borderRadius: s(12), padding: s(14), flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#99D9C1" },
  gananciasLabel: { fontSize: ms(13), fontWeight: "600", color: "#555" },
  gananciasValor: { fontSize: ms(18), fontWeight: "bold", color: "#22a06b" },
  costoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#EDF9F4", borderRadius: s(8), padding: s(8), marginTop: vs(6) },
  costoText: { fontSize: ms(13), fontWeight: "bold", color: "#22a06b" },
  metodoText: { fontSize: ms(12), color: "#666", fontStyle: "italic" },
  bottomTab: { flexDirection: "row", backgroundColor: "#99D9C1", height: vs(65), justifyContent: "space-around", alignItems: "center" },
  tabItem: { alignItems: "center" },
  tabIcon: { fontSize: ms(20) },
  tabLabel: { fontSize: ms(10), fontWeight: "bold", color: "#1A1A1A" },
});
