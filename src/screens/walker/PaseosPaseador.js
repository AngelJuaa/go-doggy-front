import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { s, vs, ms } from "../../utils/responsive";
import { apiFetch } from "../../utils/api";
import storage from "../../utils/storage";

export default function PaseosPaseador({ navigation }) {
  const [paseos, setPaseos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = JSON.parse(storage.getItem("usuario") || "{}");
    if (u.usuario_id) cargar(u.usuario_id);
  }, []);

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

  const estadoColor = {
    creado: "#FFA500", en_camino: "#007bff", completado: "#28a745", cancelado: "#dc3545",
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>↩</Text>
        </TouchableOpacity>
        <Text style={styles.title}>✅ Paseos realizados</Text>
        <View />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#99D9C1" style={{ marginTop: vs(40) }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {paseos.length === 0 ? (
            <Text style={styles.empty}>No tienes paseos registrados aún.</Text>
          ) : (
            paseos.map((p) => (
              <View key={p.servicio_id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.mascota}>🐶 {p.mascota_nombre}</Text>
                  <View style={[styles.badge, { backgroundColor: estadoColor[p.estado] || "#999" }]}>
                    <Text style={styles.badgeText}>{p.estado}</Text>
                  </View>
                </View>
                <Text style={styles.detail}>Dueño: {p.dueno_nombre}</Text>
                <Text style={styles.detail}>Tipo: {p.tipo_servicio} · {p.duracion_minutos} min</Text>
                <Text style={styles.detail}>Solicitado: {new Date(p.hora_solicitada).toLocaleDateString()}</Text>
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
  bottomTab: { flexDirection: "row", backgroundColor: "#99D9C1", height: vs(65), justifyContent: "space-around", alignItems: "center" },
  tabItem: { alignItems: "center" },
  tabIcon: { fontSize: ms(20) },
  tabLabel: { fontSize: ms(10), fontWeight: "bold", color: "#1A1A1A" },
});
