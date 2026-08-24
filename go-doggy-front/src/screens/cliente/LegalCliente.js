import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "./styles/LegalClienteStyles";
import LegalClienteBottomNav from "./LegalClienteBottomNav";

export default function LegalCliente({ navigation }) {
  const opciones = [
    ["Terminos y condiciones", "TerminosYCondicionesCliente"],
    ["Politicas de privacidad", "PoliticasDePrivacidadCliente"],
    ["Software de terceros", "SoftwareDeTercerosCliente"],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.copyright}>©</Text>
        <View style={styles.titleBox}><Text style={styles.titleText}>Legal</Text></View>
        <View style={styles.spacer} />
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>↩</Text></TouchableOpacity>
      </View>
      <View style={styles.list}>
        {opciones.map(([label, screen]) => (
          <TouchableOpacity key={screen} style={styles.item} onPress={() => navigation.navigate(screen)}>
            <Text style={styles.itemText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <LegalClienteBottomNav navigation={navigation} />
    </View>
  );
}
