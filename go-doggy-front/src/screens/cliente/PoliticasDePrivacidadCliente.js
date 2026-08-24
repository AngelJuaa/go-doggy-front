import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { styles } from "./styles/LegalDocumentClienteStyles";
import LegalClienteBottomNav from "./LegalClienteBottomNav";

export default function PoliticasDePrivacidadCliente({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}><Text style={styles.title}>Politicas de privacidad</Text><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>↩</Text></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Informacion recopilada</Text>
        <Text style={styles.body}>GoDoggy puede tratar datos de contacto, perfil, ubicacion, mascotas, direcciones, servicios, pagos y comunicaciones necesarios para operar la cuenta del cliente.</Text>
        <Text style={styles.heading}>Derechos del cliente</Text>
        <Text style={styles.body}>El cliente puede solicitar acceso, correccion, actualizacion o eliminacion de sus datos conforme a la legislacion aplicable y conocer los fines de su tratamiento.</Text>
        <Text style={styles.heading}>Obligaciones del cliente</Text>
        <Text style={styles.body}>El cliente debe proteger sus credenciales, mantener sus datos actualizados y utilizar la informacion del paseador solo para la contratacion y seguimiento del servicio.</Text>
      </ScrollView>
      <LegalClienteBottomNav navigation={navigation} />
    </View>
  );
}
