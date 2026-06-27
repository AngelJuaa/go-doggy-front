import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import storage from "../../utils/storage";

export default function NotificacionDetalle({ route, navigation }) {
  const { notificacion } = route.params || {};
  const [esPaseador, setEsPaseador] = useState(false);

  useEffect(() => {
    const u = storage.getItem("usuario");
    if (u) setEsPaseador(!!JSON.parse(u).es_paseador);
  }, []);

  if (!notificacion) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>↩</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Notificaciones</Text>
        <Text style={styles.noData}>Sin datos</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>↩</Text>
        </TouchableOpacity>
      </View>

      {/* TÍTULO */}
      <Text style={styles.titulo}>Notificaciones</Text>

      {/* SUBTÍTULO + LÍNEA */}
      <View style={styles.subtituloBox}>
        <Text style={styles.subtitulo}>
          {notificacion.fecha_creacion
            ? new Date(notificacion.fecha_creacion).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
            : notificacion.subtitulo || ""}
        </Text>
        <View style={styles.subtituloLine} />
      </View>

      {/* CONTENIDO */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.descripcion}>
          {notificacion.descripcion || notificacion.descripcion}
        </Text>
      </ScrollView>

      {/* BOTTOM TAB — adapta según rol */}
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
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("NotificacionesUsuario")}>
            <Text style={styles.tabIcon}>🔔</Text>
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
          <TouchableOpacity style={styles.tabItemCliente} onPress={() => navigation.navigate("NotificacionesUsuario")}>
            <Image source={require("../../../assets/Notificaciones.png")} style={styles.tabIconImg} />
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F0",
  },

  /* Top bar */
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 10,
  },
  menuBtn: { padding: 6 },
  menuIcon: { fontSize: 26, color: "#1a1a1a" },
  backBtn: { padding: 6 },
  backText: { fontSize: 26, color: "#1a1a1a" },

  /* Título */
  titulo: {
    fontSize: 34,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 28,
    letterSpacing: 1,
  },

  /* Subtítulo */
  subtituloBox: {
    paddingHorizontal: 22,
    marginBottom: 28,
  },
  subtitulo: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    marginBottom: 8,
  },
  subtituloLine: {
    height: 4,
    backgroundColor: "#111",
    borderRadius: 2,
    width: "100%",
  },

  /* Contenido */
  contentScroll: { flex: 1 },
  contentContainer: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  descripcion: {
    fontSize: 14,
    color: "#444",
    lineHeight: 24,
    letterSpacing: 0.3,
  },

  noData: {
    color: "#888",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },

  /* Bottom tab — paseador */
  bottomTab: {
    flexDirection: "row",
    backgroundColor: "#99D9C1",
    height: 65,
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: "100%",
    gap: 2,
  },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 10, fontWeight: "bold", color: "#1A1A1A" },

  /* Bottom tab — cliente */
  bottomTabCliente: {
    flexDirection: "row",
    backgroundColor: "#99D9C1",
    height: 65,
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItemCliente: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: "100%",
  },
  tabIconImg: { width: 28, height: 28, resizeMode: "contain" },
});
