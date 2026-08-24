import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import storage from "../../utils/storage";
import { getWalkerNotifications, WALKER_NOTIFICATIONS_KEY } from "../../utils/walkerNotifications";

export default function NotificacionesPaseador({ navigation }) {
  const [notificaciones, setNotificaciones] = useState(getWalkerNotifications());

  React.useEffect(() => {
    const actualizar = () => setNotificaciones(getWalkerNotifications());
    storage.subscribe(WALKER_NOTIFICATIONS_KEY, actualizar);
    actualizar();
    return () => storage.unsubscribe(WALKER_NOTIFICATIONS_KEY, actualizar);
  }, []);

  return (
    <View style={styles.container}>

      {/* BACK BUTTON */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>↩</Text>
      </TouchableOpacity>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.bellIcon}>🔔</Text>
        <Text style={styles.headerTitle}>Notificaciones</Text>
      </View>

      {/* LISTA */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {notificaciones.length === 0 ? (
          <Text style={styles.empty}>No tienes notificaciones todavía.</Text>
        ) : notificaciones.map((n) => (
          <View key={n.id}>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                navigation.navigate("NotificacionDetalle", { notificacion: n, role: "paseador" })
              }
            >
              {/* Ícono circular */}
              <View style={[styles.iconCircle, { backgroundColor: n.iconColor }]}>
                <Text style={styles.iconText}>{n.iconText}</Text>
              </View>

              {/* Texto */}
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{n.titulo}</Text>
                <Text style={styles.itemFecha}>{n.fecha}</Text>
              </View>

              {/* Flecha */}
              <Text style={styles.arrow}>▶</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.divider} />
      </ScrollView>

      {/* BOTTOM TAB */}
      <View style={styles.bottomTab}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate("InicioPaseador")}
        >
          <Text style={styles.tabIcon}>🏠</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate("PaseosPaseador")}
        >
          <Text style={styles.tabIcon}>✅</Text>
        </TouchableOpacity>

        {/* Bell activo */}
        <TouchableOpacity style={[styles.tabItem, styles.tabActive]}>
          <Text style={[styles.tabIcon, styles.tabIconActive]}>🔔</Text>
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
  container: { flex: 1, backgroundColor: "#F2EDD8" },

  /* Back */
  backBtn: {
    position: "absolute",
    top: 48,
    right: 18,
    zIndex: 10,
    padding: 6,
  },
  backText: { fontSize: 26, color: "#222" },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: 28,
    gap: 14,
  },
  bellIcon: { fontSize: 44 },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: 0.5,
  },

  /* Lista */
  list: { flex: 1 },

  divider: {
    height: 3,
    backgroundColor: "#111",
    marginHorizontal: 0,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 18,
    backgroundColor: "#F2EDD8",
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
  },

  itemBody: { flex: 1 },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  itemFecha: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
  },
  empty: { textAlign: "center", color: "#666", fontSize: 14, paddingVertical: 40 },

  arrow: {
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
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
  tabActive: {
    borderTopWidth: 3,
    borderTopColor: "#1a1a1a",
  },
  tabIcon: { fontSize: 22 },
  tabIconActive: { fontSize: 24 },
});
