import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";

export default function NotificacionDetalle({ route, navigation }) {
  const { notificacion } = route.params || {};

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
        <Text style={styles.subtitulo}>{notificacion.subtitulo}</Text>
        <View style={styles.subtituloLine} />
      </View>

      {/* CONTENIDO */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.descripcion}>{notificacion.descripcion}</Text>
      </ScrollView>

      {/* BOTTOM TAB */}
      <View style={styles.bottomTab}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate("Inicio_paseador")}
        >
          <Text style={styles.tabIcon}>🏠</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate("PaseosPaseador")}
        >
          <Text style={styles.tabIcon}>✅</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate("NotificacionesUsuario")}
        >
          <Text style={styles.tabIcon}>🔔</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate("PerfilPaseador")}
        >
          <Text style={styles.tabIcon}>👤</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2EDD8",
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

  /* Bottom tab */
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
  },
  tabIcon: { fontSize: 22 },
});
