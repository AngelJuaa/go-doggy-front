import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
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
  const [gananciasSemanales, setGananciasSemanales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let paseador = {};
    try { paseador = JSON.parse(storage.getItem("paseador") || "{}"); } catch (error) { paseador = {}; }
    const paseadorId = Number(paseador.paseador_id || paseador.usuario_id || paseador.id || 0);
    if (paseadorId) cargar(paseadorId);
    else setLoading(false);
  }, []);

  const cargar = async (id) => {
    try {
      const semanal = await apiFetch(`/ganancias/semanal/${id}`);
      setGananciasSemanales(Array.isArray(semanal) ? semanal : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Formatos helpers
  const moneda = (v) =>
    `$${parseFloat(v || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const dias = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
  const montos = dias.map((_, index) => Number(gananciasSemanales.find((item) => Number(item.dia) === index + 1)?.monto || 0));
  const totalSemana = montos.reduce((total, monto) => total + monto, 0);
  const maxMonto = Math.max(...montos, 1);

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

      {/* GANANCIAS SEMANALES */}
      {loading ? (
        <ActivityIndicator size="large" color="#7CEDA3" style={{ marginTop: vs(40) }} />
      ) : (
        <ScrollView contentContainerStyle={styles.weekContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.weekTitle}>Ganancias de esta semana</Text>
          <Text style={styles.weekTotal}>{moneda(totalSemana)}</Text>
          <View style={styles.chartCard}>
            <View style={styles.chart}>
              {montos.map((monto, index) => (
                <View key={dias[index]} style={styles.barColumn}>
                  <Text style={styles.barAmount}>{moneda(monto)}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { height: `${Math.max((monto / maxMonto) * 100, monto > 0 ? 5 : 0)}%` }]} />
                  </View>
                  <Text style={styles.dayLabel}>{dias[index]}</Text>
                </View>
              ))}
            </View>
          </View>
          <TouchableOpacity style={styles.moreStats} onPress={() => navigation.navigate("GananciasDetalle")}>
            <Text style={styles.moreStatsText}>Ver estadísticas detalladas</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* BARRA INFERIOR — 4 tabs, sin Ganancias */}
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

  weekContent: { paddingHorizontal: s(20), paddingTop: vs(22), paddingBottom: vs(24) },
  weekTitle: { fontSize: ms(20), fontWeight: "800", color: "#1A1A1A", marginBottom: vs(4) },
  weekTotal: { fontSize: ms(30), fontWeight: "800", color: "#2E7D5B", marginBottom: vs(18) },
  chartCard: { backgroundColor: "#fff", borderRadius: s(16), padding: s(14), minHeight: vs(280), elevation: 3, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  chart: { flex: 1, minHeight: vs(245), flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", paddingTop: vs(18) },
  barColumn: { flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end" },
  barAmount: { fontSize: ms(10), color: "#285B48", fontWeight: "700", marginBottom: vs(5) },
  barTrack: { height: "72%", width: s(25), justifyContent: "flex-end", backgroundColor: "#E8F4EF", borderRadius: s(8), overflow: "hidden" },
  bar: { width: "100%", backgroundColor: "#4DD9C0", borderRadius: s(8) },
  dayLabel: { fontSize: ms(11), color: "#555", fontWeight: "700", marginTop: vs(7) },
  moreStats: { alignSelf: "center", backgroundColor: "#1A1A1A", borderRadius: s(10), paddingHorizontal: s(16), paddingVertical: vs(10), marginTop: vs(16) },
  moreStatsText: { color: "#fff", fontSize: ms(12), fontWeight: "700" },
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
