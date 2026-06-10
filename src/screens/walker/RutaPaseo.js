import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { s, vs, ms } from "../../utils/responsive";
import { apiFetch } from "../../utils/api";
import LiveMap from "../../components/LiveMap";

export default function RutaPaseo({ route, navigation }) {
  const { servicioId } = route?.params || {};
  const [ruta, setRuta] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (servicioId) cargar();
  }, [servicioId]);

  const cargar = async () => {
    try {
      const data = await apiFetch(`/servicio/${servicioId}/ruta`);
      const coords = data.map((p) => [parseFloat(p.latitud), parseFloat(p.longitud)]);
      setRuta(coords);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const inicio = ruta[0];
  const fin = ruta[ruta.length - 1];
  const markers = [];
  if (inicio) markers.push({ position: inicio, label: "🏁 Inicio" });
  if (fin && ruta.length > 1) markers.push({ position: fin, label: "🎯 Fin" });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>↩</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🗺️ Ruta del paseo</Text>
        <View />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#99D9C1" style={{ marginTop: vs(40) }} />
      ) : (
        <View style={styles.mapWrapper}>
          <LiveMap center={inicio} markers={markers} route={ruta} />
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>📏 Puntos registrados: {ruta.length}</Text>
        {ruta.length === 0 && !loading && (
          <Text style={styles.infoText}>No se registró ruta GPS para este paseo.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: s(20), paddingTop: vs(50), paddingBottom: vs(10), backgroundColor: "#fff" },
  back: { fontSize: ms(24) },
  title: { fontSize: ms(17), fontWeight: "bold", color: "#333" },
  mapWrapper: { flex: 1 },
  infoCard: { backgroundColor: "#fff", padding: s(16), borderTopWidth: 1, borderColor: "#eee" },
  infoText: { fontSize: ms(13), color: "#555", marginBottom: vs(4) },
});
