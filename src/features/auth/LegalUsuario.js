import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { styles } from "./LegalUsuarioStyles";

export default function LegalUsuario({ navigation }) {
  const opciones = [
    "Terminos y condiciones",
    "Politicas de privacidad",
    "Software de terceros",
  ];
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={{ fontSize: 30, marginRight: 15 }}>©</Text>
        <View style={styles.titleBox}>
          <Text style={styles.titleText}>Legal</Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 28 }}>↩</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.list}>
        {opciones.map((opt, i) => (
          <TouchableOpacity key={i} style={styles.item}>
            <Text style={styles.itemText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
