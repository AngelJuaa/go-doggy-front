import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "./styles/LegalPaseadorStyles";

export default function LegalPaseadorBottomNav({ navigation }) {
  const tabs = [
    ["Inicio", "InicioPaseador", "🏠"],
    ["Paseos", "PaseosPaseador", "✅"],
    ["Notificaciones", "NotificacionesPaseador", "🔔"],
    ["Perfil", "PerfilPaseador", "👤"],
  ];

  return (
    <View style={styles.bottomTab}>
      {tabs.map(([label, screen, icon]) => (
        <TouchableOpacity key={screen} style={styles.tabItem} onPress={() => navigation.navigate(screen)}>
          <Text style={styles.tabIcon}>{icon}</Text>
          <Text style={styles.tabLabel}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
