import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { styles } from "./ConfiguracionUsuarioStyles";

export default function ConfiguracionUsuario({ navigation }) {
  const opciones = [
    "Agregar direccion",
    "Accesos directos",
    "Informacion facturas",
    "Administrar contacto",
    "Dejar propina extra",
    "Apariencia",
    "Accesibilidad",
  ];
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Image
          source={require("../../../assets/puntos.png")}
          style={styles.iconTitle}
        />
        <View style={styles.titleBox}>
          <Text style={styles.titleText}>Configuraciones</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 28 }}>↩</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.list}>
        {opciones.map((opt, i) => (
          <TouchableOpacity key={i} style={styles.item}>
            <Text style={styles.itemText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
