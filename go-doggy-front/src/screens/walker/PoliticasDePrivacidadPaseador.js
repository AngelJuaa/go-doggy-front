import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { styles } from "./styles/LegalDocumentStyles";
import LegalPaseadorBottomNav from "./LegalPaseadorBottomNav";

export default function PoliticasDePrivacidadPaseador({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}><Text style={styles.title}>Politicas de privacidad</Text><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>↩</Text></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Informacion recopilada</Text>
        <Text style={styles.body}>GoDoggy puede tratar datos de contacto, perfil, ubicacion, disponibilidad, servicios realizados y datos necesarios para operar la cuenta del paseador.</Text>
        <Text style={styles.heading}>Derechos del paseador</Text>
        <Text style={styles.body}>El paseador puede solicitar acceso, correccion o actualizacion de sus datos, asi como conocer los fines para los que son utilizados.</Text>
        <Text style={styles.heading}>Obligaciones del paseador</Text>
        <Text style={styles.body}>El paseador debe mantener sus datos actualizados, proteger sus credenciales y utilizar informacion de clientes y mascotas solo para prestar el servicio.</Text>
      </ScrollView>
      <LegalPaseadorBottomNav navigation={navigation} />
    </View>
  );
}
