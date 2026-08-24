import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { styles } from "./styles/LegalDocumentStyles";
import LegalPaseadorBottomNav from "./LegalPaseadorBottomNav";

export default function SoftwareDeTercerosPaseador({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}><Text style={styles.title}>Software de terceros</Text><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>↩</Text></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Componentes utilizados</Text>
        <Text style={styles.body}>La aplicacion puede utilizar servicios de mapas, geolocalizacion, pagos, almacenamiento, comunicacion y analitica proporcionados por terceros.</Text>
        <Text style={styles.heading}>Derechos del paseador</Text>
        <Text style={styles.body}>El paseador puede consultar la informacion publica disponible sobre los componentes externos y sus condiciones de uso.</Text>
        <Text style={styles.heading}>Obligaciones del paseador</Text>
        <Text style={styles.body}>El paseador debe utilizar estas funciones conforme a la ley, no intentar evadir sus controles y respetar las reglas de los servicios integrados.</Text>
      </ScrollView>
      <LegalPaseadorBottomNav navigation={navigation} />
    </View>
  );
}
