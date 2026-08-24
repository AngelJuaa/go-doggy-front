import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { styles } from "./styles/LegalDocumentClienteStyles";
import LegalClienteBottomNav from "./LegalClienteBottomNav";

export default function TerminosYCondicionesCliente({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}><Text style={styles.title}>Terminos y condiciones</Text><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>↩</Text></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Derechos del cliente</Text>
        <Text style={styles.body}>El cliente tiene derecho a recibir informacion clara sobre el servicio, conocer el precio antes de aceptarlo, consultar el estado del paseo y recibir atencion ante cualquier incidencia.</Text>
        <Text style={styles.heading}>Obligaciones del cliente</Text>
        <Text style={styles.body}>El cliente debe proporcionar datos veraces, entregar y recibir a sus mascotas en el horario acordado, informar sus necesidades y respetar al paseador y las reglas de la plataforma.</Text>
        <Text style={styles.heading}>Responsabilidad sobre las mascotas</Text>
        <Text style={styles.body}>El cliente debe informar alergias, enfermedades, temperamento y cuidados especiales. Tambien debe mantener disponibles los medios de contacto durante el servicio.</Text>
      </ScrollView>
      <LegalClienteBottomNav navigation={navigation} />
    </View>
  );
}
