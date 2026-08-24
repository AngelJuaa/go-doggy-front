import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { styles } from "./NotificacionesClienteStyles";
import storage from "../../../utils/storage";
import { CLIENT_NOTIFICATIONS_KEY, getClientNotifications } from "../../../utils/clientNotifications";

export default function NotificacionesCliente({ navigation }) {
  const [hoveredTab, setHoveredTab] = useState(null);
  const [notificaciones, setNotificaciones] = useState(getClientNotifications());

  useEffect(() => {
    const actualizarNotificaciones = () => setNotificaciones(getClientNotifications());
    storage.subscribe(CLIENT_NOTIFICATIONS_KEY, actualizarNotificaciones);
    actualizarNotificaciones();

    return () => storage.unsubscribe(CLIENT_NOTIFICATIONS_KEY, actualizarNotificaciones);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.navigate("PerfilUsuario")}>
          <Text style={styles.navIcon}>☰</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.navIcon}>↩</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.titleText}>Notificaciones</Text>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notificaciones.length === 0 ? (
          <Text style={{ color: "#666", textAlign: "center", marginTop: 24 }}>
            No tienes notificaciones todavía.
          </Text>
        ) : notificaciones.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.item}
            onPress={() =>
              navigation.navigate("NotificacionDetalle", {
                notificacion: item,
                role: "cliente",
              })
            }
          >
            <View style={[styles.iconCircle, { backgroundColor: item.iconColor }]}>
              <Text style={styles.iconText}>{item.iconText}</Text>
            </View>
            <View style={styles.itemBody}>
              <Text style={styles.itemTitle}>{item.titulo}</Text>
              <Text style={styles.itemFecha}>{item.fecha}</Text>
            </View>
            <Text style={styles.arrow}>▶</Text>
          </TouchableOpacity>
        ))}
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
          <Image
            source={require("../../../../assets/casa.png")}
            style={styles.tabIconImg}
          />
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
          <Image
            source={require("../../../../assets/puntos.png")}
            style={styles.tabIconImg}
          />
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
          <Image
            source={require("../../../../assets/maps.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(3)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(3)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("NotificacionesCliente")}
        >
          {hoveredTab === 3 && (
            <Text style={styles.tabLabel}>Notificaciones</Text>
          )}
          <Image
            source={require("../../../../assets/Notificaciones.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
