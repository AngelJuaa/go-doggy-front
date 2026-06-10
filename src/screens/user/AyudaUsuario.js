import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { s, vs, ms } from "../../utils/responsive";

export default function AyudaUsuario({ navigation }) {
  const [abierto, setAbierto] = useState(null);

  const faqs = [
    { id: 1, p: "¿Cómo solicito un paseo?", r: "Desde el inicio, presiona 'Buscar paseador', selecciona tu mascota, el tipo de servicio y la duración. Luego confirma tu solicitud." },
    { id: 2, p: "¿Cómo sigo a mi paseador?", r: "Una vez que el paseador acepte, verás su ubicación en tiempo real en el mapa de seguimiento." },
    { id: 3, p: "¿Cómo califico un paseo?", r: "Al finalizar el paseo, recibirás una notificación para calificar al paseador con estrellas y un comentario." },
    { id: 4, p: "¿Cómo agrego una mascota?", r: "En tu inicio, presiona el botón '+' para registrar una nueva mascota con su información." },
    { id: 5, p: "¿Cómo recargo mi billetera?", r: "Entra a la sección Billetera desde tu perfil y presiona 'Recargar saldo'." },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>❓</Text>
        <View style={styles.titleBox}>
          <Text style={styles.titleText}>Ayuda</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>↩</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Preguntas frecuentes</Text>
        {faqs.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={styles.faqCard}
            onPress={() => setAbierto(abierto === f.id ? null : f.id)}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqPregunta}>{f.p}</Text>
              <Text style={styles.faqArrow}>{abierto === f.id ? "−" : "+"}</Text>
            </View>
            {abierto === f.id && <Text style={styles.faqRespuesta}>{f.r}</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  headerRow: { flexDirection: "row", alignItems: "center", padding: s(18), paddingTop: vs(50) },
  icon: { fontSize: ms(26), marginRight: s(12) },
  titleBox: { backgroundColor: "#FFF9E6", paddingHorizontal: s(22), paddingVertical: vs(7), borderRadius: s(20), flex: 1 },
  titleText: { fontSize: ms(19), fontWeight: "bold" },
  back: { fontSize: ms(26), marginLeft: s(12) },
  content: { padding: s(16) },
  subtitle: { fontSize: ms(15), fontWeight: "bold", color: "#333", marginBottom: vs(12) },
  faqCard: { backgroundColor: "#fff", borderRadius: s(12), padding: s(14), marginBottom: vs(10), elevation: 1 },
  faqHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  faqPregunta: { fontSize: ms(14), fontWeight: "600", color: "#333", flex: 1 },
  faqArrow: { fontSize: ms(22), color: "#99D9C1", fontWeight: "bold", marginLeft: s(10) },
  faqRespuesta: { fontSize: ms(13), color: "#666", marginTop: vs(10), lineHeight: ms(20) },
});
