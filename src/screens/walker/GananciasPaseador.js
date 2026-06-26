import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { s, vs, ms } from "../../utils/responsive";
import { apiFetch } from "../../utils/api";
import storage from "../../utils/storage";

// Icono de pastel de colores (4 cuadrantes)
function PieIcon({ size = 52 }) {
  const half = size / 2;
  return (
    <View style={{ width: size, height: size, borderRadius: half, overflow: "hidden", flexDirection: "row", flexWrap: "wrap" }}>
      <View style={{ width: half, height: half, backgroundColor: "#7CEDA3" }} />
      <View style={{ width: half, height: half, backgroundColor: "#FFC107" }} />
      <View style={{ width: half, height: half, backgroundColor: "#EF5350" }} />
      <View style={{ width: half, height: half, backgroundColor: "#42A5F5" }} />
    </View>
  );
}

export default function GananciasPaseador({ navigation }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = JSON.parse(storage.getItem("usuario") || "{}");
    if (u.usuario_id) cargar(u.usuario_id);
  }, []);

  const cargar = async (id) => {
    try {
      const res = await apiFetch(`/ganancias/${id}`);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Formatos helpers
  const moneda = (v) =>
    `$${parseFloat(v || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const tiempo = () =>
    data
      ? `${data.horas_conectado} h ${String(data.minutos_conectado).padStart(2, "0")} min`
      : "— h — min";
  const paseos = () =>
    data
      ? `${data.total_paseos} completados  ${data.total_cancelados} cancelados`
      : "— completados  — cancelados";
  const estrellas = () =>
    data
      ? `${data.total_estrellas} de ${data.max_estrellas || "—"}`
      : "— de —";

  const stats = [
    { label: "Ganancias", valor: data ? moneda(data.total_ganado) : "—", route: "GananciasDetalle" },
    { label: "Conectado", valor: tiempo(),  route: "ConectadoDetalle" },
    { label: "Paseos",    valor: paseos(),  route: "PaseosDetalle"   },
    { label: "Estrellas", valor: estrellas(), route: "EstrellasDetalle" },
  ];

  return (
    <View style={styles.container}>
      {/* BACK TOP-RIGHT */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>↩</Text>
      </TouchableOpacity>

      {/* CARD DE GRÁFICAS */}
      <View style={styles.graficasCard}>
        <PieIcon size={52} />
        <Text style={styles.graficasTitle}>Graficas</Text>
      </View>

      {/* LISTA DE ESTADÍSTICAS */}
      {loading ? (
        <ActivityIndicator size="large" color="#7CEDA3" style={{ marginTop: vs(40) }} />
      ) : (
        <View style={styles.statsList}>
          {stats.map((item, i) => (
            <View key={i} style={styles.statRow}>
              <View style={styles.statContent}>
                <View style={styles.statTop}>
                  <Text style={styles.statLabel}>{item.label}</Text>
                  <TouchableOpacity style={styles.arrowBtn} onPress={() => navigation.navigate(item.route)}>
                    <Text style={styles.arrowText}>▶</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.statValue}>{item.valor}</Text>
              </View>
              <View style={styles.divider} />
            </View>
          ))}
        </View>
      )}

      {/* BARRA INFERIOR — 4 tabs, sin Ganancias */}
      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("Inicio_paseador")}>
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

const BG = "#F2EDD8";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Botón volver
  backBtn: {
    position: "absolute",
    top: vs(48),
    right: s(20),
    zIndex: 10,
    padding: s(6),
  },
  backIcon: { fontSize: ms(22), color: "#1A1A1A" },

  // Card superior "Gráficas"
  graficasCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(14),
    backgroundColor: "#E8DFBF",
    marginTop: vs(80),
    marginHorizontal: s(20),
    borderRadius: s(14),
    paddingVertical: vs(18),
    paddingHorizontal: s(20),
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  graficasTitle: {
    fontSize: ms(26),
    fontFamily: "serif",
    fontWeight: "600",
    color: "#1A1A1A",
  },

  // Lista stats
  statsList: {
    marginTop: vs(24),
    paddingHorizontal: s(20),
    flex: 1,
  },
  statRow: { marginBottom: vs(4) },
  statContent: { paddingBottom: vs(10) },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: vs(4),
  },
  statLabel: {
    fontSize: ms(20),
    fontWeight: "800",
    color: "#0D0D0D",
    fontFamily: "serif",
  },
  statValue: {
    fontSize: ms(15),
    color: "#0D0D0D",
    fontWeight: "400",
  },
  arrowBtn: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: { color: "#fff", fontSize: ms(12) },
  divider: {
    height: 3,
    backgroundColor: "#0D0D0D",
    borderRadius: 2,
    marginBottom: vs(12),
  },

  // Bottom tab
  bottomTab: {
    flexDirection: "row",
    backgroundColor: "#99D9C1",
    height: vs(65),
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: { alignItems: "center" },
  tabIcon: { fontSize: ms(20) },
  tabLabel: { fontSize: ms(10), fontWeight: "bold", color: "#1A1A1A" },
});
