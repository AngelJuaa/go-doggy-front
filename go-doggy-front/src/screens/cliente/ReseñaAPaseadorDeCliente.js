import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_URL } from "../../utils/api";
import storage from "../../utils/storage";
import styles from "./ReseñaAPaseadorDeClienteStyle";

const RESEÑA_PENDIENTE_KEY = "resena_paseador_pendiente";

const CATEGORIAS = ["General", "Eficiente", "Amabilidad", "Confianza", "Comunicacion"];

export default function ReseñaAPaseadorDeCliente({ route, navigation }) {
  const { servicioId, paseadorId: paseadorIdParam } = route?.params || {};
  const [ratings, setRatings] = useState(Object.fromEntries(CATEGORIAS.map((category) => [category, 0])));
  const [notas, setNotas] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const obtenerPaseadorId = async () => {
    const paseadorInicial = Number(paseadorIdParam || 0);
    if (paseadorInicial) return paseadorInicial;
    if (!servicioId) return 0;

    const detalleResponse = await fetch(`${API_URL}/servicio/${servicioId}`);
    const detalle = await detalleResponse.json();
    if (!detalleResponse.ok) throw new Error(detalle.message || "No se pudo cargar el servicio.");
    return Number(detalle.paseador_id || 0);
  };

  const cerrar = () => {
    storage.removeItem(RESEÑA_PENDIENTE_KEY);
    navigation.reset({ index: 0, routes: [{ name: "Inicio_cliente" }] });
  };

  const guardar = async () => {
    const cliente = JSON.parse(storage.getItem("usuario") || "{}");
    const clienteId = Number(cliente.usuario_id || 0);
    if (!ratings.General) {
      setError("Selecciona una calificación general.");
      return;
    }

    setLoading(true);
    try {
      const paseadorId = await obtenerPaseadorId();
      if (!servicioId || !clienteId || !paseadorId) {
        throw new Error("No se pudo identificar el servicio para guardar la reseña.");
      }

      const response = await fetch(`${API_URL}/calificaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicio_id: Number(servicioId),
          califica_usuario_id: clienteId,
          calificado_usuario_id: Number(paseadorId),
          valor_calificacion: ratings.General,
          comentario: notas.trim(),
          categorias: ratings,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo guardar la reseña");
      cerrar();
      Alert.alert("Reseña guardada", "Gracias por calificar al paseador.");
    } catch (requestError) {
      setError(requestError.message || "No se pudo guardar la reseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={cerrar}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.panel}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Califica a tu paseador</Text>
            <Text style={styles.subtitle}>Tu opinión ayuda a mejorar GoDoggy</Text>
            <Text style={styles.service}>Servicio #{servicioId}</Text>
            <TouchableOpacity onPress={() => setExpanded((value) => !value)}>
              <Text style={styles.categoryName}>{expanded ? "Ocultar categorias" : "Ver categorias"} {expanded ? "▲" : "▼"}</Text>
            </TouchableOpacity>
            {(expanded ? CATEGORIAS : ["General"]).map((category) => (
              <View key={category} style={styles.category}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{category}</Text>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <TouchableOpacity key={value} onPress={() => setRatings((current) => ({ ...current, [category]: value }))}>
                        <Text style={[styles.star, ratings[category] >= value && styles.starSelected]}>★</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ))}
            <Text style={styles.notesLabel}>Notas extra</Text>
            <TextInput value={notas} onChangeText={setNotas} style={styles.notes} multiline placeholder="Escribe un comentario (opcional)" />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.omit} onPress={cerrar} disabled={loading}><Text style={styles.actionText}>Cerrar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submit} onPress={guardar} disabled={loading}><Text style={styles.actionText}>{loading ? "Guardando..." : "Enviar"}</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
