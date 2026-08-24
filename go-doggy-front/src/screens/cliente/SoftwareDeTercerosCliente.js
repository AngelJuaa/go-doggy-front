import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { styles } from "./styles/LegalDocumentClienteStyles";
import LegalClienteBottomNav from "./LegalClienteBottomNav";

export default function SoftwareDeTercerosCliente({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}><Text style={styles.title}>Software de terceros</Text><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>↩</Text></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Componentes utilizados</Text>
        <Text style={styles.body}>La aplicacion puede utilizar servicios de mapas, geolocalizacion, pagos, almacenamiento, comunicacion y analitica proporcionados por terceros.</Text>
        <Text style={styles.heading}>Derechos del cliente</Text>
        <Text style={styles.body}>El cliente puede conocer los servicios externos que intervienen en la experiencia y consultar sus condiciones publicas de uso.</Text>
        <Text style={styles.heading}>Obligaciones del cliente</Text>
        <Text style={styles.body}>El cliente debe utilizar estas funciones conforme a la ley, no intentar alterar sus controles y respetar las reglas de los proveedores integrados.</Text>
      </ScrollView>
      <LegalClienteBottomNav navigation={navigation} />
    </View>
  );
}
