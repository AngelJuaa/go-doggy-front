import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { styles } from "./styles/LegalDocumentStyles";
import LegalPaseadorBottomNav from "./LegalPaseadorBottomNav";

export default function TerminosYCondicionesPaseador({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}><Text style={styles.title}>Terminos y condiciones</Text><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>↩</Text></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Derechos del paseador</Text>
        <Text style={styles.body}>El paseador tiene derecho a recibir informacion clara del servicio, conocer la tarifa aplicable y recibir el pago correspondiente por los servicios realizados conforme a las reglas de la plataforma.</Text>
        <Text style={styles.heading}>Obligaciones del paseador</Text>
        <Text style={styles.body}>El paseador debe proporcionar informacion veraz, cuidar a las mascotas, respetar los horarios, mantener comunicacion con el cliente y reportar cualquier incidente de forma inmediata.</Text>
        <Text style={styles.heading}>Uso de la plataforma</Text>
        <Text style={styles.body}>El paseador debe utilizar la plataforma de forma responsable, respetar a clientes y mascotas, y cumplir las instrucciones de seguridad y operacion vigentes.</Text>
      </ScrollView>
      <LegalPaseadorBottomNav navigation={navigation} />
    </View>
  );
}
