import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { styles } from "./styles/LegalClienteStyles";

export default function LegalClienteBottomNav({ navigation }) {
  const tabs = [
    ["Inicio", "Inicio_cliente", require("../../../assets/casa.png")],
    ["Servicio", "Servicio_Cliente_Inicio", require("../../../assets/puntos.png")],
    ["Mapa", "MapaCliente", require("../../../assets/maps.png")],
    ["Notificaciones", "NotificacionesCliente", require("../../../assets/Notificaciones.png")],
  ];
  return (
    <View style={styles.bottomTab}>
      {tabs.map(([label, screen, icon]) => (
        <TouchableOpacity key={screen} style={styles.tabItem} onPress={() => navigation.navigate(screen)}>
          <Image source={icon} style={styles.tabIconImg} />
          <Text style={styles.tabLabel}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
