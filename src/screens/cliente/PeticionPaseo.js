import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  TextInput, Alert, StyleSheet, ActivityIndicator, Image,
} from "react-native";
import { s, vs, ms } from "../../utils/responsive";
import { API_URL, apiFetch } from "../../utils/api";
import storage from "../../utils/storage";
import { requestLocationPermission, getCurrentPosition } from "../../utils/geo";
import { getSocket } from "../../utils/socket";

const DIRECCION_SELECCIONADA_KEY = "direccion_mapa_seleccionada";

const getDireccionLabel = (direccion) => {
  if (!direccion) return null;

  const calle = direccion.calle || "Sin calle";
  const numero = direccion.numero_calle || direccion.numero_externo || "";
  const colonia = direccion.colonia || "";

  return `${calle}${numero ? ` #${numero}` : ""}${colonia ? ` · ${colonia}` : ""}`;
};

const getDireccionCoords = (direccion) => {
  const latitud = Number(direccion?.latitud);
  const longitud = Number(direccion?.longitud);

  if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
    return null;
  }

  return { latitud, longitud };
};

const readSelectedDireccion = () => {
  const raw = storage.getItem(DIRECCION_SELECCIONADA_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    return null;
  }
};

const getMascotaLabel = (mascota) => {
  const nombre = mascota?.nombre || "Sin nombre";
  const tipo = mascota?.tipo_mascota || mascota?.tipoMascota || mascota?.raza || "Sin tipo";
  return `${nombre} (${tipo})`;
};

export default function PeticionPaseo({ navigation }) {
  const [mascotas, setMascotas] = useState([]);
  const [mascotasSeleccionadas, setMascotasSeleccionadas] = useState([]);
  const [tipoServicio, setTipoServicio] = useState("Paseo");
  const [duracion, setDuracion] = useState("30");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [focusedField, setFocusedField] = useState("");
  const [direccionGuardada, setDireccionGuardada] = useState(readSelectedDireccion());
  const [servicioPendienteId, setServicioPendienteId] = useState(null);
  const socket = getSocket();

  const tiposServicio = ["Paseo", "Guardería", "Veterinaria", "Estética"];
  const duraciones = ["15", "30", "45", "60", "90"];

  useEffect(() => {
    const u = JSON.parse(storage.getItem("usuario") || "{}");
    setUsuario(u);
    if (u?.usuario_id) {
      socket.emit("cliente:online", { clienteId: u.usuario_id });
    }
    if (u.usuario_id) cargarMascotas(u.usuario_id);
    setDireccionGuardada(readSelectedDireccion());
  }, [socket]);

  useEffect(() => {
    if (!servicioPendienteId) return;

    const handleServicioAceptado = (payload) => {
      const servicioId = Number(payload?.servicio_id);
      if (!servicioId || servicioId !== servicioPendienteId) return;

      setServicioPendienteId(null);
      Alert.alert(
        "¡Paseador aceptó tu solicitud!",
        "Te mostramos la ubicación y la ruta en vivo.",
        [{ text: "Ver mapa", onPress: () => navigation.navigate("MapaCliente", { servicioId }) }]
      );

      navigation.navigate("MapaCliente", { servicioId });
    };

    socket.on("cliente:servicio:aceptado", handleServicioAceptado);
    return () => {
      socket.off("cliente:servicio:aceptado", handleServicioAceptado);
    };
  }, [socket, servicioPendienteId, navigation]);

  const cargarMascotas = async (id) => {
    try {
      const data = await apiFetch(`/mascotas/${id}`);
      setMascotas(data);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMascotaSeleccionada = (mascota) => {
    setMascotasSeleccionadas((current) => {
      const existe = current.some((item) => item.mascota_id === mascota.mascota_id);
      if (existe) {
        return current.filter((item) => item.mascota_id !== mascota.mascota_id);
      }

      return [...current, mascota];
    });
  };

  const solicitarPaseo = async () => {
    if (mascotasSeleccionadas.length === 0) {
      Alert.alert("Error", "Selecciona una o más mascotas primero.");
      return;
    }
    setLoading(true);
    try {
      // Obtener ubicación REAL del cliente (GPS en nativo, navegador en web)
      let lat = 19.4326, lng = -99.1332;
      await requestLocationPermission();
      const pos = await getCurrentPosition();
      if (pos) { lat = pos.lat; lng = pos.lng; }

      const payload = {
        dueno_id: usuario.usuario_id,
        mascota_ids: mascotasSeleccionadas.map((mascota) => mascota.mascota_id),
        tipo_servicio: tipoServicio,
        duracion_minutos: parseInt(duracion),
        notas_dueno: notas,
        lat,
        lng,
      };

      const servicio = await apiFetch("/servicio", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setServicioPendienteId(Number(servicio.servicio_id));

      Alert.alert(
        "¡Solicitud enviada!",
        "Un paseador se encargará pronto. Te llevamos al mapa cuando acepten.",
        [{ text: "Ver en mapa", onPress: () => navigation.navigate("MapaCliente", { servicioId: servicio.servicio_id }) }]
      );
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>↩</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Petición de Paseo</Text>
          <View />
        </View>

        <View style={styles.formCard}>
          {/* UBICACIÓN GUARDADA */}
          <Text style={styles.sectionLabel}>Ubicación guardada</Text>
          <View style={styles.ubicacionCard}>
            {direccionGuardada ? (
              <>
                <Text style={styles.ubicacionTitulo}>📍 Tu ubicación actual</Text>
                <Text style={styles.ubicacionTexto}>{getDireccionLabel(direccionGuardada)}</Text>
                {getDireccionCoords(direccionGuardada) ? (
                  <Text style={styles.ubicacionCoords}>
                    Lat: {getDireccionCoords(direccionGuardada).latitud.toFixed(6)}
                    {'\n'}Lng: {getDireccionCoords(direccionGuardada).longitud.toFixed(6)}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.emptyText}>No tienes una ubicación guardada seleccionada en el mapa.</Text>
            )}
          </View>

          {/* MASCOTA */}
          <Text style={styles.sectionLabel}>Selecciona una o más mascotas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mascotaScroll}>
            {mascotas.map((m) => (
              <TouchableOpacity
                key={m.mascota_id}
                style={[
                  styles.mascotaChip,
                  mascotasSeleccionadas.some((item) => item.mascota_id === m.mascota_id) && styles.chipSelected,
                ]}
                onPress={() => toggleMascotaSeleccionada(m)}
              >
                <Text
                  style={[
                    styles.chipText,
                    mascotasSeleccionadas.some((item) => item.mascota_id === m.mascota_id) && styles.chipTextSelected,
                  ]}
                >
                  🐶 {getMascotaLabel(m)}
                </Text>
              </TouchableOpacity>
            ))}
            {mascotas.length === 0 && (
              <Text style={styles.emptyText}>No tienes mascotas. Regístra una primero.</Text>
            )}
          </ScrollView>

          {/* TIPO DE SERVICIO */}
          <Text style={styles.sectionLabel}>Tipo de servicio</Text>
          <View style={styles.optionRow}>
            {tiposServicio.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.optionChip, tipoServicio === t && styles.chipSelected]}
                onPress={() => setTipoServicio(t)}
              >
                <Text style={[styles.chipText, tipoServicio === t && styles.chipTextSelected]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* DURACIÓN */}
          <Text style={styles.sectionLabel}>Duración (minutos)</Text>
          <View style={styles.optionRow}>
            {duraciones.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.duracionChip, duracion === d && styles.chipSelected]}
                onPress={() => setDuracion(d)}
              >
                <Text style={[styles.chipText, duracion === d && styles.chipTextSelected]}>{d} min</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* NOTAS */}
          <Text style={styles.sectionLabel}>Notas para el paseador</Text>
          <TextInput
            style={[styles.notasInput, focusedField === "notas" && styles.inputFocused]}
            multiline
            numberOfLines={4}
            placeholder="Ej: Mi perro es amigable, tiene miedo a los coches..."
            value={notas}
            onChangeText={setNotas}
            placeholderTextColor="#aaa"
            onFocus={() => setFocusedField("notas")}
            onBlur={() => setFocusedField("")}
          />

          {/* RESUMEN */}
          {mascotasSeleccionadas.length > 0 && (
            <View style={styles.resumenCard}>
              <Text style={styles.resumenTitle}>Resumen</Text>
              <Text style={styles.resumenItem}>
                🐶 Mascotas: <Text style={styles.resumenVal}>{mascotasSeleccionadas.map((m) => getMascotaLabel(m)).join(", ")}</Text>
              </Text>
              <Text style={styles.resumenItem}>🦮 Servicio: <Text style={styles.resumenVal}>{tipoServicio}</Text></Text>
              <Text style={styles.resumenItem}>⏱ Duración: <Text style={styles.resumenVal}>{duracion} min</Text></Text>
            </View>
          )}

          {/* BOTÓN */}
          <TouchableOpacity
            style={[styles.btnSolicitar, loading && styles.btnDisabled]}
            onPress={solicitarPaseo}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>🐾 Solicitar Paseo</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomTab}>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(0)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(0)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("Inicio_cliente")}
        >
          {hoveredTab === 0 && <Text style={styles.tabLabel}>Inicio</Text>}
          <Image source={require("../../../assets/casa.png")} style={styles.tabIconImg} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(1)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(1)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("Servicio_Cliente_Inicio")}
        >
          {hoveredTab === 1 && <Text style={styles.tabLabel}>Servicio</Text>}
          <Image source={require("../../../assets/puntos.png")} style={styles.tabIconImg} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(2)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(2)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("MapaCliente")}
        >
          {hoveredTab === 2 && <Text style={styles.tabLabel}>Mapa</Text>}
          <Image source={require("../../../assets/maps.png")} style={styles.tabIconImg} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(3)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(3)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("NotificacionesCliente")}
        >
          {hoveredTab === 3 && <Text style={styles.tabLabel}>Notificaciones</Text>}
          <Image
            source={require("../../../assets/Notificaciones.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  scrollView: { flex: 1 },
  content: { padding: s(20), paddingBottom: vs(95) },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: vs(20), paddingTop: vs(40) },
  back: { fontSize: ms(26) },
  title: { fontSize: ms(20), fontWeight: "bold", color: "#333" },
  formCard: {
    backgroundColor: "#99D9C1",
    borderRadius: s(20),
    padding: s(18),
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  ubicacionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: s(16),
    padding: s(14),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
  },
  ubicacionTitulo: {
    fontSize: ms(14),
    fontWeight: "bold",
    color: "#333",
    marginBottom: vs(6),
  },
  ubicacionTexto: {
    fontSize: ms(13),
    color: "#333",
    fontWeight: "600",
    lineHeight: 20,
  },
  ubicacionCoords: {
    marginTop: vs(8),
    fontSize: ms(12),
    color: "#555",
    lineHeight: 18,
  },
  sectionLabel: { fontSize: ms(14), fontWeight: "bold", color: "#555", marginTop: vs(16), marginBottom: vs(8) },
  mascotaScroll: { marginBottom: vs(4) },
  mascotaChip: { backgroundColor: "#fff", borderRadius: s(20), paddingHorizontal: s(16), paddingVertical: vs(8), marginRight: s(10), borderWidth: 2, borderColor: "#ddd" },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: s(8), marginBottom: vs(4) },
  optionChip: { backgroundColor: "#fff", borderRadius: s(20), paddingHorizontal: s(14), paddingVertical: vs(7), borderWidth: 2, borderColor: "#ddd" },
  duracionChip: { backgroundColor: "#fff", borderRadius: s(16), paddingHorizontal: s(12), paddingVertical: vs(6), borderWidth: 2, borderColor: "#ddd" },
  chipSelected: { backgroundColor: "#D2B48C", borderColor: "#D2B48C" },
  chipText: { fontSize: ms(13), color: "#555", fontWeight: "600" },
  chipTextSelected: { color: "#333" },
  emptyText: { fontSize: ms(13), color: "#aaa", fontStyle: "italic" },
  notasInput: { backgroundColor: "#fff", borderRadius: s(12), padding: s(12), borderWidth: 1, borderColor: "#ddd", fontSize: ms(14), minHeight: vs(90), textAlignVertical: "top", color: "#333" },
  inputFocused: {
    borderColor: "#D2B48C",
    shadowColor: "#D2B48C",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  resumenCard: { backgroundColor: "#fff", borderRadius: s(16), padding: s(16), marginTop: vs(16), borderWidth: 1, borderColor: "#D2B48C" },
  resumenTitle: { fontSize: ms(15), fontWeight: "bold", color: "#333", marginBottom: vs(8) },
  resumenItem: { fontSize: ms(13), color: "#666", marginBottom: vs(4) },
  resumenVal: { fontWeight: "bold", color: "#333" },
  btnSolicitar: { backgroundColor: "#E6B5B5", borderRadius: s(25), paddingVertical: vs(15), alignItems: "center", marginTop: vs(24) },
  btnDisabled: { backgroundColor: "#ccc" },
  btnText: { fontSize: ms(17), fontWeight: "bold", color: "#333" },
  bottomTab: {
    flexDirection: "row",
    backgroundColor: "#99D9C1",
    height: vs(65),
    position: "absolute",
    bottom: 0,
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabIconImg: { width: s(38), height: s(38), resizeMode: "contain" },
  tabItem: { alignItems: "center", justifyContent: "center" },
  tabLabel: { fontSize: ms(11), fontWeight: "bold", color: "#333", marginBottom: vs(4) },
});
