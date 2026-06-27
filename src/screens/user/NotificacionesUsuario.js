import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import storage from "../../utils/storage";
import { API_URL } from "../../utils/api";
import { vs, ms, s } from "../../utils/responsive";

const TIPO_META = {
  paseo:        { color: "#7CEDA3", icono: "🐕" },
  calificacion: { color: "#FFC107", icono: "⭐" },
  info:         { color: "#1E88E5", icono: "ℹ️" },
};

function formatFecha(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

export default function NotificacionesUsuario({ navigation }) {
  const [usuario, setUsuario] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const u = storage.getItem("usuario");
      if (!u) return;
      const user = JSON.parse(u);
      setUsuario(user);
      cargarNotificaciones(user.usuario_id);
    }, [])
  );

  const cargarNotificaciones = async (uid) => {
    try {
      setCargando(true);
      const res = await fetch(`${API_URL}/notificaciones/${uid}`);
      const data = await res.json();
      setNotificaciones(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error cargando notificaciones:", e);
      setNotificaciones([]);
    } finally {
      setCargando(false);
    }
  };

  const abrirNotificacion = async (n) => {
    // Marcar como leída en el backend
    if (!n.leida) {
      fetch(`${API_URL}/notificaciones/${n.notificacion_id}/leer`, { method: "PUT" }).catch(() => {});
      setNotificaciones(prev =>
        prev.map(x => x.notificacion_id === n.notificacion_id ? { ...x, leida: true } : x)
      );
    }
    navigation.navigate("NotificacionDetalle", { notificacion: n });
  };

  const eliminarNotificacion = async (id) => {
    fetch(`${API_URL}/notificaciones/${id}`, { method: "DELETE" }).catch(() => {});
    setNotificaciones(prev => prev.filter(x => x.notificacion_id !== id));
  };

  const esPaseador = usuario?.es_paseador;
  const sinLeer = notificaciones.filter(n => !n.leida).length;

  return (
    <View style={styles.container}>
      {/* BACK BUTTON */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>↩</Text>
      </TouchableOpacity>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.bellIcon}>🔔</Text>
        <View>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          {sinLeer > 0 && (
            <Text style={styles.sinLeerText}>{sinLeer} sin leer</Text>
          )}
        </View>
      </View>

      {/* LISTA */}
      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#99D9C1" />
        </View>
      ) : notificaciones.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🔕</Text>
          <Text style={styles.emptyText}>Sin notificaciones por ahora</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {notificaciones.map((n) => {
            const meta = TIPO_META[n.tipo] || TIPO_META.info;
            const color = n.color_icono || meta.color;
            const icono = n.icono || meta.icono;
            return (
              <View key={n.notificacion_id}>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={[styles.item, !n.leida && styles.itemNoLeida]}
                  onPress={() => abrirNotificacion(n)}
                  onLongPress={() => eliminarNotificacion(n.notificacion_id)}
                >
                  {/* Punto de no leída */}
                  {!n.leida && <View style={styles.puntito} />}

                  {/* Ícono circular */}
                  <View style={[styles.iconCircle, { backgroundColor: color }]}>
                    <Text style={styles.iconText}>{icono}</Text>
                  </View>

                  {/* Texto */}
                  <View style={styles.itemBody}>
                    <Text style={[styles.itemTitle, !n.leida && styles.itemTitleBold]}>
                      {n.titulo}
                    </Text>
                    <Text style={styles.itemFecha}>{formatFecha(n.fecha_creacion)}</Text>
                  </View>

                  {/* Flecha */}
                  <Text style={styles.arrow}>▶</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          <View style={styles.divider} />
          <Text style={styles.hintText}>Mantén presionado para eliminar</Text>
        </ScrollView>
      )}

      {/* BOTTOM TAB */}
      {esPaseador ? (
        <View style={styles.bottomTab}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("Inicio_paseador")}>
            <Text style={styles.tabIcon}>🏠</Text>
            <Text style={styles.tabLabel}>Inicio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("PaseosPaseador")}>
            <Text style={styles.tabIcon}>✅</Text>
            <Text style={styles.tabLabel}>Paseos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabItem, styles.tabActive]}>
            <Text style={[styles.tabIcon, styles.tabIconActive]}>🔔</Text>
            <Text style={styles.tabLabel}>Notificaciones</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("PerfilPaseador")}>
            <Text style={styles.tabIcon}>👤</Text>
            <Text style={styles.tabLabel}>Perfil</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bottomTabCliente}>
          <TouchableOpacity style={styles.tabItemCliente} onPress={() => navigation.navigate("Inicio_cliente")}>
            <Image source={require("../../../assets/casa.png")} style={styles.tabIconImg} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItemCliente} onPress={() => navigation.navigate("Servicio_Cliente_Inicio")}>
            <Image source={require("../../../assets/puntos.png")} style={styles.tabIconImg} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItemCliente} onPress={() => navigation.navigate("MapaCliente")}>
            <Image source={require("../../../assets/maps.png")} style={styles.tabIconImg} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabItemCliente, styles.tabActive]}>
            <Image source={require("../../../assets/Notificaciones.png")} style={styles.tabIconImg} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },

  backBtn: { position: "absolute", top: vs(48), right: s(18), zIndex: 10, padding: s(6) },
  backText: { fontSize: ms(26), color: "#222" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: vs(52),
    paddingBottom: vs(24),
    paddingHorizontal: s(28),
    gap: s(14),
  },
  bellIcon: { fontSize: ms(44) },
  headerTitle: { fontSize: ms(32), fontWeight: "700", color: "#1a1a1a", letterSpacing: 0.5 },
  sinLeerText: { fontSize: ms(12), color: "#E53935", fontWeight: "700", marginTop: vs(2) },

  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: vs(12) },
  emptyIcon: { fontSize: ms(52) },
  emptyText: { fontSize: ms(15), color: "#888", fontWeight: "500" },

  list: { flex: 1 },

  divider: { height: 3, backgroundColor: "#111" },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(22),
    paddingVertical: vs(18),
    backgroundColor: "#F5F5F0",
    position: "relative",
  },
  itemNoLeida: { backgroundColor: "#EDF9F4" },

  puntito: {
    position: "absolute",
    left: s(8),
    top: "50%",
    width: s(8),
    height: s(8),
    borderRadius: s(4),
    backgroundColor: "#E53935",
  },

  iconCircle: {
    width: s(52),
    height: s(52),
    borderRadius: s(26),
    justifyContent: "center",
    alignItems: "center",
    marginRight: s(16),
  },
  iconText: { fontSize: ms(22) },

  itemBody: { flex: 1 },
  itemTitle: { fontSize: ms(15), fontWeight: "500", color: "#1a1a1a", marginBottom: vs(4) },
  itemTitleBold: { fontWeight: "700" },
  itemFecha: { fontSize: ms(12), color: "#555", fontWeight: "500" },

  arrow: { fontSize: ms(14), color: "#333", marginLeft: s(10) },

  hintText: { textAlign: "center", color: "#aaa", fontSize: ms(11), paddingVertical: vs(12) },

  bottomTab: {
    flexDirection: "row",
    backgroundColor: "#99D9C1",
    height: vs(65),
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: { alignItems: "center", justifyContent: "center", flex: 1, height: "100%", gap: vs(2) },
  tabActive: { borderTopWidth: 3, borderTopColor: "#1a1a1a" },
  tabIcon: { fontSize: ms(20) },
  tabIconActive: { fontSize: ms(22) },
  tabLabel: { fontSize: ms(10), fontWeight: "bold", color: "#1A1A1A" },

  bottomTabCliente: {
    flexDirection: "row",
    backgroundColor: "#99D9C1",
    height: vs(65),
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItemCliente: { alignItems: "center", justifyContent: "center", flex: 1, height: "100%" },
  tabIconImg: { width: s(28), height: s(28), resizeMode: "contain" },
});
