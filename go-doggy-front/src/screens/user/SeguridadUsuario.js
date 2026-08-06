import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { styles } from "./styles/SeguridadUsuarioStyles";
import { s, ms } from "../../utils/responsive";

export default function SeguridadUsuario({ navigation }) {
  const opciones = [
    "Comprobacion de seguridad",
    "Inicio de sesion",
    "Recuperar cuenta",
  ];
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={{ fontSize: ms(28), marginRight: s(14) }}>🛡️</Text>
        <View style={styles.titleBox}>
          <Text style={styles.titleText}>Seguridad</Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: ms(26) }}>↩</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.list}>
        {opciones.map((opt, i) => (
          <TouchableOpacity key={i} style={styles.itemRow}>
            <Text style={styles.itemText}>{opt}</Text>
            <Text style={{ fontSize: ms(18) }}></Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
