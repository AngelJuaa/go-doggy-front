import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  TextInput, StyleSheet, ActivityIndicator, Platform,
} from "react-native";
import { s, vs, ms } from "../../utils/responsive";
import { apiFetch } from "../../utils/api";
import storage from "../../utils/storage";
import useToast from "../../utils/useToast";
import ConfirmModal from "../../components/ConfirmModal";

const DEFAULT_LAT = 20.907715;
const DEFAULT_LNG = -100.707582;

export default function PeticionPaseo({ navigation }) {
  const [mascotas, setMascotas] = useState([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [tipoServicio, setTipoServicio] = useState("Paseo");
  const [duracion, setDuracion] = useState("30");
  const [notas, setNotas] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [servicioCreado, setServicioCreado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Ubicación
  const [locationLat, setLocationLat] = useState(DEFAULT_LAT);
  const [locationLng, setLocationLng] = useState(DEFAULT_LNG);
  const [locationStatus, setLocationStatus] = useState("loading"); // 'loading' | 'ok' | 'fallback'

  // Direcciones guardadas del cliente
  const [direcciones, setDirecciones]         = useState([]);
  const [dirSeleccionada, setDirSeleccionada] = useState(null); // null = usar GPS

  const iframeRef = useRef(null);
  const isWeb = Platform.OS === "web";
  const { showToast, ToastComponent } = useToast();

  const tiposServicio = ["Paseo", "Guardería", "Veterinaria", "Estética"];
  const duraciones = ["15", "30", "45", "60", "90"];
  const metodosPago = ["Efectivo", "Tarjeta", "Transferencia"];

  const calcularCosto = (tipo, dur) => {
    const d = parseInt(dur) || 30;
    if (tipo === "Paseo") {
      if (d <= 15) return 50;
      if (d <= 30) return 80;
      if (d <= 45) return 120;
      if (d <= 60) return 150;
      return 220;
    }
    if (tipo === "Guardería")  return 200;
    if (tipo === "Veterinaria") return 350;
    if (tipo === "Estética")   return 280;
    return 80;
  };

  // ─── Mini mapa Leaflet (web) ────────────────────────────────────────────────
  const miniMapHtml = useMemo(() => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="initial-scale=1.0,width=device-width"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>html,body,#map{margin:0;height:100%;width:100%;}</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([${DEFAULT_LAT},${DEFAULT_LNG}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
    const marker = L.marker([${DEFAULT_LAT},${DEFAULT_LNG}], {draggable:true})
      .addTo(map).bindPopup('📍 Tu ubicación').openPopup();
    marker.on('dragend', function(e) {
      const {lat, lng} = e.target.getLatLng();
      window.parent.postMessage({type:'locationChanged', lat, lng}, '*');
    });
    window.addEventListener('message', function(ev) {
      if (!ev.data || ev.data.type !== 'setLocation') return;
      marker.setLatLng([ev.data.lat, ev.data.lng]);
      map.setView([ev.data.lat, ev.data.lng], 15, {animate:true});
    });
  </script>
</body>
</html>`, []);

  // ─── Carga inicial: usuario, mascotas y ubicación ───────────────────────────
  useEffect(() => {
    const u = JSON.parse(storage.getItem("usuario") || "{}");
    setUsuario(u);
    if (u.usuario_id) {
      cargarMascotas(u.usuario_id);
      apiFetch(`/direcciones/${u.usuario_id}`)
        .then((data) => {
          const dirs = data || [];
          setDirecciones(dirs);
          // Pre-seleccionar la primera con coordenadas exactas
          const exacta = dirs.find((d) => d.coordenadas_refinadas && d.latitud && d.longitud);
          if (exacta) setDirSeleccionada(exacta);
        })
        .catch(() => {});
    }

    // Obtener ubicación al montar
    obtenerUbicacion();

    // Escuchar pin arrastrado desde el iframe
    if (isWeb) {
      const handleMessage = (ev) => {
        if (ev.data?.type === "locationChanged") {
          setLocationLat(ev.data.lat);
          setLocationLng(ev.data.lng);
        }
      };
      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }
  }, [isWeb]);

  const obtenerUbicacion = () => {
    setLocationStatus("loading");
    if (isWeb) {
      if (!navigator?.geolocation) { setLocationStatus("fallback"); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLocationLat(lat);
          setLocationLng(lng);
          setLocationStatus("ok");
          iframeRef.current?.contentWindow?.postMessage({ type: "setLocation", lat, lng }, "*");
        },
        () => setLocationStatus("fallback"),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    } else {
      // Nativo: usa expo-location
      const Location = require("expo-location");
      Location.requestForegroundPermissionsAsync().then(({ status }) => {
        if (status !== "granted") { setLocationStatus("fallback"); return; }
        return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      }).then((pos) => {
        if (pos?.coords) {
          setLocationLat(pos.coords.latitude);
          setLocationLng(pos.coords.longitude);
          setLocationStatus("ok");
        } else {
          setLocationStatus("fallback");
        }
      }).catch(() => setLocationStatus("fallback"));
    }
  };

  // Enviar ubicación al iframe del mapa
  const enviarUbicacionAlMapa = (lat, lng) => {
    iframeRef.current?.contentWindow?.postMessage({ type: "setLocation", lat, lng }, "*");
  };

  // Seleccionar dirección guardada: geocodifica si faltan coords
  const seleccionarDireccion = async (dir) => {
    if (dir.latitud && dir.longitud) {
      setDirSeleccionada(dir);
      enviarUbicacionAlMapa(parseFloat(dir.latitud), parseFloat(dir.longitud));
    } else {
      // Geocodificar la dirección para obtener coordenadas
      try {
        const query = [dir.calle, dir.numero_exterior, dir.colonia, dir.codigo_postal]
          .filter(Boolean).join(" ");
        const params = new URLSearchParams({ q: query });
        if (dir.codigo_postal) params.append("cp", dir.codigo_postal);
        const data = await apiFetch(`/geocode/search?${params}`);
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const dirConCoords = { ...dir, latitud: lat, longitud: lng };
          setDirSeleccionada(dirConCoords);
          enviarUbicacionAlMapa(lat, lng);
          return;
        }
      } catch { /* silencioso */ }
      // Sin coords y sin geocoding: seleccionar igual (usará GPS al crear servicio)
      setDirSeleccionada(dir);
      showToast("No se pudo ubicar esta dirección en el mapa", "warning");
    }
  };

  const cargarMascotas = async (id) => {
    try {
      const data = await apiFetch(`/mascotas/${id}`);
      setMascotas(data);
      if (data.length > 0) setMascotaSeleccionada(data[0]);
    } catch (e) {
      console.error(e);
    }
  };

  // ─── Crear solicitud ────────────────────────────────────────────────────────
  const solicitarPaseo = async () => {
    if (!mascotaSeleccionada) {
      showToast("Selecciona una mascota primero.", "warning");
      return;
    }
    if (locationStatus === "loading") {
      showToast("Espera, obteniendo tu ubicación...", "info");
      return;
    }
    setLoading(true);
    try {
      const pickupLat = dirSeleccionada?.latitud  ? parseFloat(dirSeleccionada.latitud)  : locationLat;
      const pickupLng = dirSeleccionada?.longitud ? parseFloat(dirSeleccionada.longitud) : locationLng;
      const pickupTexto = dirSeleccionada
        ? [dirSeleccionada.calle, dirSeleccionada.numero_exterior, dirSeleccionada.colonia]
            .filter(Boolean).join(" ")
        : null;

      const servicio = await apiFetch("/servicio", {
        method: "POST",
        body: JSON.stringify({
          dueno_id:         usuario.usuario_id,
          mascota_id:       mascotaSeleccionada.mascota_id,
          tipo_servicio:    tipoServicio,
          duracion_minutos: parseInt(duracion),
          notas_dueno:      notas,
          metodo_pago:      metodoPago,
          lat:              pickupLat,
          lng:              pickupLng,
          direccion_texto:  pickupTexto,
        }),
      });
      setServicioCreado(servicio);
      setConfirmVisible(true);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Helpers de UI ──────────────────────────────────────────────────────────
  const locationLabel = () => {
    if (locationStatus === "loading") return "⏳ Obteniendo ubicación...";
    if (locationStatus === "ok")
      return `📍 ${locationLat.toFixed(5)}, ${locationLng.toFixed(5)}`;
    return "⚠️ GPS no disponible — arrastra el pin para ajustar";
  };

  const locationColor = () => {
    if (locationStatus === "loading") return "#888";
    if (locationStatus === "ok")      return "#22a06b";
    return "#e67e22";
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>↩</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Solicitar Servicio</Text>
          <View />
        </View>

        {/* MASCOTAS */}
        <Text style={styles.sectionLabel}>Selecciona tu mascota</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mascotaScroll}>
          {mascotas.map((m) => (
            <TouchableOpacity
              key={m.mascota_id}
              style={[styles.mascotaChip, mascotaSeleccionada?.mascota_id === m.mascota_id && styles.chipSelected]}
              onPress={() => setMascotaSeleccionada(m)}
            >
              <Text style={[styles.chipText, mascotaSeleccionada?.mascota_id === m.mascota_id && styles.chipTextSelected]}>
                🐶 {m.nombre}
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

        {/* MÉTODO DE PAGO */}
        <Text style={styles.sectionLabel}>Método de pago</Text>
        <View style={styles.optionRow}>
          {metodosPago.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.optionChip, metodoPago === m && styles.chipSelected]}
              onPress={() => setMetodoPago(m)}
            >
              <Text style={[styles.chipText, metodoPago === m && styles.chipTextSelected]}>
                {m === "Efectivo" ? "💵 " : m === "Tarjeta" ? "💳 " : "📲 "}{m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* COSTO ESTIMADO */}
        <View style={styles.costoCard}>
          <Text style={styles.costoLabel}>Costo estimado</Text>
          <Text style={styles.costoValor}>${calcularCosto(tipoServicio, duracion)} MXN</Text>
        </View>

        {/* NOTAS */}
        <Text style={styles.sectionLabel}>Notas para el paseador</Text>
        <TextInput
          style={styles.notasInput}
          multiline
          numberOfLines={3}
          placeholder="Ej: Mi perro es amigable, tiene miedo a los coches..."
          value={notas}
          onChangeText={setNotas}
          placeholderTextColor="#aaa"
        />

        {/* DIRECCIÓN DE RECOGIDA */}
        <Text style={styles.sectionLabel}>Dirección de recogida</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {/* Opción: usar GPS */}
          <TouchableOpacity
            style={[styles.addrChip, !dirSeleccionada && styles.addrChipSel]}
            onPress={() => {
              setDirSeleccionada(null);
              if (locationStatus === "ok") enviarUbicacionAlMapa(locationLat, locationLng);
            }}
          >
            <Text style={[styles.addrChipTxt, !dirSeleccionada && styles.addrChipTxtSel]}>
              📡 Mi GPS
            </Text>
          </TouchableOpacity>

          {/* Direcciones guardadas */}
          {direcciones.map((dir) => (
            <TouchableOpacity
              key={dir.direccion_id}
              style={[styles.addrChip, dirSeleccionada?.direccion_id === dir.direccion_id && styles.addrChipSel]}
              onPress={() => seleccionarDireccion(dir)}
            >
              <Text style={[styles.addrChipTxt, dirSeleccionada?.direccion_id === dir.direccion_id && styles.addrChipTxtSel]} numberOfLines={1}>
                {dir.coordenadas_refinadas ? "📍 " : "🏠 "}
                {dir.nombre_referencia || dir.calle}
              </Text>
              {dir.coordenadas_refinadas && (
                <Text style={styles.addrExacta}>Exacta</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* UBICACIÓN GPS (solo si no hay dirección seleccionada) */}
        {!dirSeleccionada && <Text style={styles.sectionLabel}>Tu ubicación GPS</Text>}
        <View style={styles.locationRow}>
          <Text style={[styles.locationText, { color: locationColor() }]}>
            {locationLabel()}
          </Text>
          {locationStatus !== "loading" && (
            <TouchableOpacity style={styles.refreshBtn} onPress={obtenerUbicacion}>
              <Text style={styles.refreshText}>↺ Actualizar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* MINI MAPA (web) */}
        {isWeb && (
          <View style={styles.miniMapWrapper}>
            <iframe
              ref={iframeRef}
              title="Ubicación del servicio"
              srcDoc={miniMapHtml}
              sandbox="allow-scripts"
              style={{ width: "100%", height: 200, border: "none", borderRadius: 12 }}
            />
            <Text style={styles.mapHint}>
              {locationStatus === "fallback"
                ? "GPS no disponible — arrastra el pin 📍 para fijar tu ubicación"
                : "Arrastra el pin 📍 para ajustar tu ubicación exacta"}
            </Text>
          </View>
        )}

        {/* RESUMEN */}
        {mascotaSeleccionada && (
          <View style={styles.resumenCard}>
            <Text style={styles.resumenTitle}>Resumen</Text>
            <Text style={styles.resumenItem}>🐶 Mascota: <Text style={styles.resumenVal}>{mascotaSeleccionada.nombre}</Text></Text>
            <Text style={styles.resumenItem}>🦮 Servicio: <Text style={styles.resumenVal}>{tipoServicio}</Text></Text>
            <Text style={styles.resumenItem}>⏱ Duración: <Text style={styles.resumenVal}>{duracion} min</Text></Text>
            <Text style={styles.resumenItem}>
              📍 Recogida:{" "}
              <Text style={[styles.resumenVal, { color: dirSeleccionada ? "#22a06b" : locationColor() }]}>
                {dirSeleccionada
                  ? `${dirSeleccionada.nombre_referencia || dirSeleccionada.calle}${dirSeleccionada.coordenadas_refinadas ? " ✓" : ""}`
                  : locationStatus === "ok" ? "GPS exacto" : locationStatus === "loading" ? "obteniendo..." : "manual (pin)"}
              </Text>
            </Text>
            <Text style={styles.resumenItem}>
              💳 Pago: <Text style={styles.resumenVal}>{metodoPago}</Text>
            </Text>
            <Text style={styles.resumenItem}>
              💰 Costo: <Text style={[styles.resumenVal, { color: "#22a06b" }]}>${calcularCosto(tipoServicio, duracion)} MXN</Text>
            </Text>
          </View>
        )}

        {/* BOTÓN SOLICITAR */}
        <TouchableOpacity
          style={[styles.btnSolicitar, (loading || locationStatus === "loading") && styles.btnDisabled]}
          onPress={solicitarPaseo}
          disabled={loading || locationStatus === "loading"}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>🐾 Solicitar Paseo</Text>
          )}
        </TouchableOpacity>

      </ScrollView>

      <ConfirmModal
        visible={confirmVisible}
        title="¡Solicitud enviada! 🐾"
        message="Tu solicitud está pendiente. Un paseador la aceptará pronto. ¿Deseas ver el seguimiento en el mapa?"
        confirmText="Ver mapa"
        cancelText="Cerrar"
        onConfirm={() => {
          setConfirmVisible(false);
          navigation.navigate("MapaCliente", { servicioId: servicioCreado?.servicio_id });
        }}
        onCancel={() => setConfirmVisible(false)}
      />
      {ToastComponent}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#F5F5F0" },
  content:    { padding: s(20), paddingBottom: vs(40) },
  header:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: vs(20), paddingTop: vs(40) },
  back:       { fontSize: ms(26) },
  title:      { fontSize: ms(20), fontWeight: "bold", color: "#333" },

  sectionLabel: { fontSize: ms(14), fontWeight: "bold", color: "#555", marginTop: vs(16), marginBottom: vs(8) },

  mascotaScroll: { marginBottom: vs(4) },
  mascotaChip:   { backgroundColor: "#fff", borderRadius: s(20), paddingHorizontal: s(16), paddingVertical: vs(8), marginRight: s(10), borderWidth: 2, borderColor: "#ddd" },
  optionRow:     { flexDirection: "row", flexWrap: "wrap", gap: s(8), marginBottom: vs(4) },
  optionChip:    { backgroundColor: "#fff", borderRadius: s(20), paddingHorizontal: s(14), paddingVertical: vs(7), borderWidth: 2, borderColor: "#ddd" },
  duracionChip:  { backgroundColor: "#fff", borderRadius: s(16), paddingHorizontal: s(12), paddingVertical: vs(6), borderWidth: 2, borderColor: "#ddd" },
  chipSelected:      { backgroundColor: "#99D9C1", borderColor: "#99D9C1" },
  chipText:          { fontSize: ms(13), color: "#555", fontWeight: "600" },
  chipTextSelected:  { color: "#fff" },
  emptyText:         { fontSize: ms(13), color: "#aaa", fontStyle: "italic" },

  notasInput: { backgroundColor: "#fff", borderRadius: s(12), padding: s(12), borderWidth: 1, borderColor: "#ddd", fontSize: ms(14), minHeight: vs(80), textAlignVertical: "top", color: "#333" },

  locationRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", borderRadius: s(12), padding: s(12), borderWidth: 1, borderColor: "#ddd", marginBottom: vs(8) },
  locationText: { fontSize: ms(12), fontWeight: "600", flex: 1 },
  refreshBtn:   { marginLeft: s(8), backgroundColor: "#f0f0f0", borderRadius: s(8), paddingHorizontal: s(10), paddingVertical: vs(4) },
  refreshText:  { fontSize: ms(12), color: "#555", fontWeight: "600" },

  miniMapWrapper: { borderRadius: s(12), overflow: "hidden", marginBottom: vs(4), borderWidth: 1, borderColor: "#ddd" },
  mapHint:        { fontSize: ms(11), color: "#888", textAlign: "center", paddingVertical: vs(6), backgroundColor: "#fff" },

  resumenCard:  { backgroundColor: "#fff", borderRadius: s(16), padding: s(16), marginTop: vs(16), borderWidth: 1, borderColor: "#99D9C1" },
  resumenTitle: { fontSize: ms(15), fontWeight: "bold", color: "#333", marginBottom: vs(8) },
  resumenItem:  { fontSize: ms(13), color: "#666", marginBottom: vs(4) },
  resumenVal:   { fontWeight: "bold", color: "#333" },

  btnSolicitar: { backgroundColor: "#7CEDA3", borderRadius: s(25), paddingVertical: vs(15), alignItems: "center", marginTop: vs(24) },
  btnDisabled:  { backgroundColor: "#ccc" },
  btnText:      { fontSize: ms(17), fontWeight: "bold", color: "#333" },

  costoCard: { backgroundColor: "#EDF9F4", borderRadius: s(12), padding: s(14), marginTop: vs(8), flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#99D9C1" },
  costoLabel: { fontSize: ms(13), fontWeight: "600", color: "#555" },
  costoValor: { fontSize: ms(18), fontWeight: "bold", color: "#22a06b" },

  addrChip: {
    backgroundColor: "#fff",
    borderRadius: s(12),
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    marginRight: s(8),
    borderWidth: 2,
    borderColor: "#ddd",
    minWidth: s(100),
    alignItems: "center",
  },
  addrChipSel:    { backgroundColor: "#EDF9F4", borderColor: "#22a06b" },
  addrChipTxt:    { fontSize: ms(13), color: "#555", fontWeight: "600" },
  addrChipTxtSel: { color: "#22a06b" },
  addrExacta:     { fontSize: ms(10), color: "#22a06b", fontWeight: "700", marginTop: vs(2) },
});
