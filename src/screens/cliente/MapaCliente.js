import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StyleSheet,
  TextInput,
} from "react-native";
import useToast from "../../utils/useToast";
import { styles } from "./MapaClienteStyles";

const finStyles = StyleSheet.create({
  overlay:         { position: "absolute", bottom: 72, left: 0, right: 0, backgroundColor: "rgba(10,20,15,0.96)", padding: 20, zIndex: 200 },
  title:           { color: "#fff", fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  costoRow:        { flexDirection: "row", gap: 10, marginBottom: 14 },
  costoBox:        { flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 10, padding: 10, alignItems: "center" },
  costoLabel:      { color: "#aaa", fontSize: 11, marginBottom: 4 },
  costoValor:      { color: "#7CEDA3", fontSize: 16, fontWeight: "bold" },
  ratingLabel:     { color: "#ddd", fontSize: 14, textAlign: "center", marginBottom: 8 },
  starsRow:        { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 10 },
  star:            { fontSize: 34 },
  comentarioInput: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 10, padding: 10, color: "#fff", fontSize: 13, marginBottom: 12, minHeight: 50 },
  btns:            { flexDirection: "row", justifyContent: "space-around", gap: 10 },
  btn:             { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14, alignItems: "center" },
  btnTxt:          { fontWeight: "bold", fontSize: 14, color: "#1A1A1A" },
  skipText:        { color: "#aaa", fontSize: 12, textAlign: "center", marginTop: 12, textDecorationLine: "underline" },
  calificadoMsg:   { color: "#FFD700", fontSize: 16, textAlign: "center", marginVertical: 12, fontWeight: "bold" },
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 2,
    borderTopColor: "#99D9C1",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#99D9C1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  info: { flex: 1 },
  nombre: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  calif: { fontSize: 12, color: "#555", marginTop: 2 },
  badge: {
    backgroundColor: "#EDF9F4",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeTxt: { fontSize: 12, fontWeight: "700", color: "#22a06b" },
});

import { getSocket } from "../../utils/socket";
import { API_URL, apiFetch } from "../../utils/api";
import storage from "../../utils/storage";
import AgregarDireccionModal from "../../components/AgregarDireccionModal";

const enCaminoStyles = StyleSheet.create({
  strip: {
    backgroundColor: "#EDF9F4",
    borderTopWidth: 1,
    borderTopColor: "#99D9C1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  msg: { flex: 1, fontSize: 13, color: "#1a4731", fontWeight: "600" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#007bff" },
});

const addrStyles = StyleSheet.create({
  section: {
    width: "95%",
    maxWidth: 420,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: "#333" },
  addBtn: {
    backgroundColor: "#22a06b",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addBtnTxt: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  emptyTxt:  { fontSize: 13, color: "#999", textAlign: "center", paddingVertical: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: "#99D9C1",
  },
  cardBody:  { flex: 1 },
  cardName:  { fontSize: 14, fontWeight: "700", color: "#222", marginBottom: 2 },
  cardAddr:  { fontSize: 13, color: "#444", marginBottom: 1 },
  cardSub:   { fontSize: 12, color: "#777" },
  cardChip:  {
    fontSize: 11,
    color: "#555",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  deleteBtn:    { padding: 6, marginLeft: 4 },
  deleteBtnTxt: { fontSize: 18, color: "#cc4444", fontWeight: "bold" },
});

const refinarStyles = StyleSheet.create({
  banner: {
    position: "absolute",
    bottom: 70,
    left: 0,
    right: 0,
    backgroundColor: "#1a4731",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 600,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -3 },
    elevation: 10,
  },
  hint: {
    color: "#d0f5e5",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  btns: {
    flexDirection: "row",
    gap: 10,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#22a06b",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  saveTxt: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  cancelBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelTxt: { color: "#d0f5e5", fontWeight: "600", fontSize: 14 },
});

const DEFAULT_LOCATION = { latitude: 20.907715, longitude: -100.707582 };

let MapView = null;
let Marker = null;
let Polyline = null;
let PROVIDER_GOOGLE = null;

if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    MapView = Maps.default || Maps;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE || null;
  } catch (e) {
    console.log("react-native-maps no disponible", e);
  }
}

const ESTADO_COLOR = {
  esperando: "#FFA500",
  en_camino: "#007bff",
  activo:    "#28a745",
  finalizado:"#6c757d",
};
const ESTADO_LABEL = {
  esperando:  "⏳ Esperando paseador...",
  en_camino:  "🚶 Paseador en camino",
  activo:     "🐾 Paseo en curso",
  finalizado: "✅ Paseo finalizado",
};

export default function MapaCliente({ route, navigation }) {
  const { servicioId } = route?.params || {};

  const [hoveredTab, setHoveredTab]   = useState(null);
  const [clientePos, setClientePos]   = useState(null);
  const [paseadorPos, setPaseadorPos] = useState(null);
  const [rutaPaseador, setRutaPaseador] = useState([]);
  const [displayCoords, setDisplayCoords] = useState("Esperando ubicación...");
  const [address, setAddress]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [estado, setEstado]     = useState("esperando");
  const [error, setError]       = useState(null);
  const [paseadorInfo, setPaseadorInfo] = useState(null);
  const [servicioData, setServicioData] = useState(null);
  const [mascotaNombre, setMascotaNombre] = useState(null);
  const [usuarioId, setUsuarioId]           = useState(null);
  const [direcciones, setDirecciones]       = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [loadingDirId, setLoadingDirId]     = useState(null);
  const [selectedDirId, setSelectedDirId]   = useState(null);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [calificando, setCalificando] = useState(false);
  const [calificado, setCalificado] = useState(false);
  const paseadorIdRef = useRef(null);
  const { showToast, ToastComponent } = useToast();

  const watchIdRef    = useRef(null);
  const iframeRef     = useRef(null);
  const lastLocRef    = useRef(DEFAULT_LOCATION);
  const scrollViewRef = useRef(null);
  const rutaRef     = useRef([]);
  const isWeb       = Platform.OS === "web";
  const socket      = getSocket();

  // ─── HTML del mapa web (generado una sola vez) ───────────────────────────────
  const webMapHtml = useMemo(() => `<!DOCTYPE html>
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
    const map = L.map('map').setView([${DEFAULT_LOCATION.latitude},${DEFAULT_LOCATION.longitude}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);

    // Marcador del cliente (pin estándar, arrastrable para geocoding)
    const clienteIcon = L.icon({
      iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize:[25,41], iconAnchor:[12,41], popupAnchor:[1,-34], shadowSize:[41,41]
    });
    const clienteMarker = L.marker([${DEFAULT_LOCATION.latitude},${DEFAULT_LOCATION.longitude}],
      {icon:clienteIcon, draggable:true}).addTo(map).bindPopup('📍 Tu ubicación');

    clienteMarker.on('dragend', function(ev) {
      const {lat, lng} = ev.target.getLatLng();
      window.parent.postMessage({type:'markerMoved', latitude:lat, longitude:lng}, '*');
    });

    // Click en cualquier parte del mapa mueve el pin ahí
    map.on('click', function(e) {
      clienteMarker.setLatLng(e.latlng);
      window.parent.postMessage({type:'markerMoved', latitude:e.latlng.lat, longitude:e.latlng.lng}, '*');
    });

    // Marcador del paseador (emoji perro)
    const paseadorIcon = L.divIcon({
      html:'<div style="font-size:28px;line-height:28px">🐕</div>',
      className:'', iconSize:[28,28], iconAnchor:[14,28]
    });
    let paseadorMarker = null;
    let routeLine = null;

    // Escuchar mensajes del padre para actualizar posiciones
    window.addEventListener('message', function(ev) {
      if (!ev.data) return;
      const d = ev.data;

      if (d.type === 'updateCliente') {
        clienteMarker.setLatLng([d.lat, d.lng]);
        map.setView([d.lat, d.lng], 16, {animate:true});
      }

      if (d.type === 'updatePaseador') {
        if (!paseadorMarker) {
          paseadorMarker = L.marker([d.lat, d.lng], {icon:paseadorIcon})
            .addTo(map).bindPopup('🐕 Paseador');
        } else {
          paseadorMarker.setLatLng([d.lat, d.lng]);
        }
        // Mostrar paseador y cliente al mismo tiempo
        const clienteLatlng = clienteMarker.getLatLng();
        const bounds = L.latLngBounds([paseadorMarker.getLatLng(), clienteLatlng]);
        map.fitBounds(bounds, {padding: [60, 60], maxZoom: 17, animate: true});
        if (d.route && d.route.length > 1) {
          if (routeLine) map.removeLayer(routeLine);
          routeLine = L.polyline(d.route, {color:'#00ff99', weight:4}).addTo(map);
        }
      }
    });
  </script>
</body>
</html>`, []);

  // ─── Geolocalización del cliente ─────────────────────────────────────────────
  useEffect(() => {
    const onSuccess = ({ coords: { latitude, longitude } }) => {
      const pos = { latitude, longitude };
      lastLocRef.current = pos;
      setClientePos(pos);
      setDisplayCoords(`Lat: ${latitude.toFixed(6)}\nLng: ${longitude.toFixed(6)}`);
      setLoading(false);
      setError(null);
      iframeRef.current?.contentWindow?.postMessage(
        { type: "updateCliente", lat: latitude, lng: longitude }, "*"
      );
    };
    const onError = () => {
      setClientePos(DEFAULT_LOCATION);
      setError("No se pudo obtener la ubicación en tiempo real.");
      setLoading(false);
    };
    const geoOpts = { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 };

    if (isWeb && navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOpts);
      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, geoOpts);
    } else {
      setClientePos(DEFAULT_LOCATION);
      setLoading(false);
    }
    return () => {
      if (watchIdRef.current !== null && isWeb && navigator?.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isWeb]);

  // ─── Cargar estado actual del servicio al montar ─────────────────────────────
  useEffect(() => {
    if (!servicioId) return;
    fetch(`${API_URL}/servicio/${servicioId}`)
      .then((r) => r.json())
      .then((data) => {
        const ESTADO_MAP = { creado: "esperando", en_camino: "en_camino", activo: "activo", completado: "finalizado" };
        if (ESTADO_MAP[data.estado]) setEstado(ESTADO_MAP[data.estado]);
        if (data.paseador_id) paseadorIdRef.current = data.paseador_id;
        if (data.paseador_nombre) {
          setPaseadorInfo({
            nombre_completo:       data.paseador_nombre,
            url_foto_perfil:       data.paseador_foto,
            telefono:              data.paseador_telefono,
            calificacion_promedio: data.paseador_calificacion,
          });
        }
        setServicioData({
          costo_total:  parseFloat(data.costo_total || data.costo_estimado || 0),
          metodo_pago:  data.metodo_pago || "Efectivo",
          paseador_id:  data.paseador_id,
        });
        if (data.mascota_nombre) setMascotaNombre(data.mascota_nombre);
        // Si ya fue calificado, marcar
        if (data.estado === "completado") {
          fetch(`${API_URL}/calificacion/servicio/${servicioId}`)
            .then((r) => r.json())
            .then((c) => { if (c.calificado) setCalificado(true); })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [servicioId]);

  // ─── Socket: seguimiento del paseador en tiempo real ─────────────────────────
  useEffect(() => {
    if (!servicioId) return;
    socket.emit("cliente:watch", { servicioId });

    socket.on("servicio:aceptado", (data) => {
      setEstado("en_camino");
      showToast("¡Tu paseador aceptó la solicitud y está en camino! 🐾", "success");
      if (data?.paseador) {
        setPaseadorInfo(data.paseador);
        if (data.paseador.usuario_id) paseadorIdRef.current = data.paseador.usuario_id;
      }
      // Mostrar marcador inicial del paseador cerca del cliente
      const base = lastLocRef.current;
      const initLat = base.latitude  + 0.003;
      const initLng = base.longitude + 0.003;
      setPaseadorPos({ latitude: initLat, longitude: initLng });
      rutaRef.current = [[initLat, initLng]];
      iframeRef.current?.contentWindow?.postMessage(
        { type: "updatePaseador", lat: initLat, lng: initLng, route: [] }, "*"
      );
    });

    socket.on("paseador:location", (coord) => {
      setPaseadorPos({ latitude: coord.lat, longitude: coord.lng });
      rutaRef.current = [...rutaRef.current, [coord.lat, coord.lng]];
      setRutaPaseador([...rutaRef.current]);
      iframeRef.current?.contentWindow?.postMessage({
        type:  "updatePaseador",
        lat:   coord.lat,
        lng:   coord.lng,
        route: rutaRef.current,
      }, "*");
    });

    socket.on("servicio:finalizado", (data) => {
      setEstado("finalizado");
      if (data?.costo_total !== undefined) {
        setServicioData((prev) => ({
          ...prev,
          costo_total: parseFloat(data.costo_total || 0),
          metodo_pago: data.metodo_pago || prev?.metodo_pago || "Efectivo",
        }));
      }
    });

    socket.on("servicio:iniciado", () => {
      setEstado("activo");
      showToast("🐾 ¡Tu paseador ya recogió a tu mascota! El paseo comenzó.", "success");
    });

    return () => {
      socket.off("servicio:aceptado");
      socket.off("paseador:location");
      socket.off("servicio:finalizado");
      socket.off("servicio:iniciado");
    };
  }, [servicioId]);

  // ─── Geocoding de la posición del cliente ────────────────────────────────────
  useEffect(() => {
    if (!clientePos) return;
    let active = true;
    const fetch_ = async () => {
      setAddress(null);
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${clientePos.latitude}&lon=${clientePos.longitude}&zoom=18&addressdetails=1&accept-language=es`
        );
        const data = await resp.json();
        if (!active) return;
        const a = data.address || {};
        const street = a.road || a.street || a.residential || a.pedestrian ||
          a.neighbourhood || a.suburb || a.town || a.city || null;
        const num = a.house_number ? ` ${a.house_number}` : "";
        setAddress(street ? `${street}${num}` : null);
        setDisplayCoords(
          `Lat: ${clientePos.latitude.toFixed(6)}\nLng: ${clientePos.longitude.toFixed(6)}`
        );
      } catch {
        setAddress(null);
      }
    };
    fetch_();
    return () => { active = false; };
  }, [clientePos]);

  // ─── Manejar pin arrastrado en iframe ────────────────────────────────────────
  useEffect(() => {
    if (!isWeb) return;
    const handleMessage = (ev) => {
      if (ev.data?.type !== "markerMoved") return;
      const { latitude, longitude } = ev.data;
      const pos = { latitude, longitude };
      lastLocRef.current = pos;
      setClientePos(pos);
      setDisplayCoords(`Lat: ${latitude.toFixed(6)}\nLng: ${longitude.toFixed(6)}`);
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isWeb]);

  // ─── Cargar direcciones guardadas ───────────────────────────────────────────
  useEffect(() => {
    const u = JSON.parse(storage.getItem("usuario") || "{}");
    if (!u.usuario_id) return;
    setUsuarioId(u.usuario_id);
    apiFetch(`/direcciones/${u.usuario_id}`)
      .then((data) => setDirecciones(data || []))
      .catch(() => {});
  }, []);

  const handleSelectDireccion = async (dir) => {
    setLoadingDirId(dir.direccion_id);
    setSelectedDirId(null);
    let lat = null;
    let lng = null;

    if (dir.coordenadas_refinadas && dir.latitud && dir.longitud) {
      // El usuario ya fijó la ubicación exacta arrastrando el pin — usarla directamente
      lat = parseFloat(dir.latitud);
      lng = parseFloat(dir.longitud);
    } else {
      // Aún no refinada: geocodificar para navegar a la zona aproximada
      try {
        const query = [dir.calle, dir.numero_exterior, dir.colonia, dir.codigo_postal]
          .filter(Boolean).join(" ");
        const params = new URLSearchParams({ q: query });
        if (dir.codigo_postal) params.append("cp", dir.codigo_postal);
        const data = await apiFetch(`/geocode/search?${params}`);
        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
        }
      } catch { /* silencioso */ }

      // Fallback: coords guardadas si geocoding falla
      if (!lat || !lng) {
        lat = dir.latitud  ? parseFloat(dir.latitud)  : null;
        lng = dir.longitud ? parseFloat(dir.longitud) : null;
      }
    }

    setLoadingDirId(null);

    if (!lat || !lng) {
      showToast("No se encontraron coordenadas para esta dirección.", "warning");
      return;
    }

    const pos = { latitude: lat, longitude: lng };
    lastLocRef.current = pos;
    setClientePos(pos);
    setDisplayCoords(`Lat: ${lat.toFixed(6)}\nLng: ${lng.toFixed(6)}`);

    iframeRef.current?.contentWindow?.postMessage(
      { type: "updateCliente", lat, lng }, "*"
    );

    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    showToast(`📍 ${dir.nombre_referencia || dir.calle}`, "success");

    // Activar modo refinamiento: el usuario puede arrastrar el pin y guardar la ubicación exacta
    setSelectedDirId(dir.direccion_id);
  };

  const guardarCoordsExactas = async () => {
    if (!selectedDirId) return;
    const lat = lastLocRef.current?.latitude;
    const lng = lastLocRef.current?.longitude;
    if (!lat || !lng) return;
    try {
      await apiFetch(`/direcciones/${selectedDirId}/coordenadas`, {
        method: "PATCH",
        body: JSON.stringify({ latitud: lat, longitud: lng }),
      });
      setDirecciones((prev) =>
        prev.map((d) =>
          d.direccion_id === selectedDirId
            ? { ...d, latitud: lat, longitud: lng, coordenadas_refinadas: true }
            : d
        )
      );
      setSelectedDirId(null);
      showToast("📍 Ubicación exacta guardada", "success");
    } catch {
      showToast("Error al guardar la ubicación", "error");
    }
  };

  const handleDeleteDireccion = async (direccionId) => {
    try {
      await apiFetch(`/direcciones/${direccionId}`, { method: "DELETE" });
      setDirecciones((prev) => prev.filter((d) => d.direccion_id !== direccionId));
    } catch {
      showToast("Error al eliminar dirección", "error");
    }
  };

  const handleAddressSaved = (nuevaDireccion) => {
    setDirecciones((prev) => [nuevaDireccion, ...prev]);
  };

  const handleLocationFromModal = (lat, lng) => {
    const pos = { latitude: parseFloat(lat), longitude: parseFloat(lng) };
    lastLocRef.current = pos;
    setClientePos(pos);
    setDisplayCoords(`Lat: ${pos.latitude.toFixed(6)}\nLng: ${pos.longitude.toFixed(6)}`);
    iframeRef.current?.contentWindow?.postMessage(
      { type: "updateCliente", lat: pos.latitude, lng: pos.longitude }, "*"
    );
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const locOrDefault = clientePos || DEFAULT_LOCATION;
  const region = {
    latitude:      locOrDefault.latitude,
    longitude:     locOrDefault.longitude,
    latitudeDelta: 0.05,
    longitudeDelta:0.05,
  };
  const nativeRoute = rutaPaseador.map(p => ({ latitude: p[0], longitude: p[1] }));

  const sendInitialPosition = () => {
    if (clientePos) {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "updateCliente", lat: clientePos.latitude, lng: clientePos.longitude }, "*"
      );
    }
    if (paseadorPos) {
      iframeRef.current?.contentWindow?.postMessage({
        type:  "updatePaseador",
        lat:   paseadorPos.latitude,
        lng:   paseadorPos.longitude,
        route: rutaRef.current,
      }, "*");
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Estado del servicio */}
      {servicioId && (
        <View style={[styles.estadoBadge, { backgroundColor: ESTADO_COLOR[estado] }]}>
          <Text style={styles.estadoText}>{ESTADO_LABEL[estado]}</Text>
        </View>
      )}

      <Text style={styles.titleText}>
        {servicioId ? "Seguimiento en vivo" : "Ver ubicación"}
      </Text>

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#E6B5B5" />
          <Text style={styles.loadingText}>Buscando ubicación...</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* CAJA DE UBICACIÓN */}
          <View style={styles.locationBox}>
            <Text style={styles.locationTitle}>📍 Tu ubicación</Text>
            {address ? <Text style={styles.addressText}>{address}</Text> : null}
            <Text style={styles.coords}>{displayCoords}</Text>
            {paseadorPos ? (
              <Text style={[styles.coords, { marginTop: 4 }]}>
                🐕 Paseador: {paseadorPos.latitude.toFixed(5)}, {paseadorPos.longitude.toFixed(5)}
              </Text>
            ) : null}
          </View>

          {/* CONTENEDOR DEL MAPA */}
          <View style={[styles.mapContainer, expanded && styles.mapContainerExpanded]}>
            {MapView && Marker && Polyline && !isWeb ? (
              <MapView
                style={styles.mapWebView}
                provider={PROVIDER_GOOGLE || undefined}
                initialRegion={region}
                showsUserLocation
                showsMyLocationButton
                loadingEnabled
              >
                {nativeRoute.length > 1 && (
                  <Polyline
                    coordinates={nativeRoute}
                    strokeColor="#00ff99"
                    strokeWidth={4}
                  />
                )}
                {paseadorPos && (
                  <Marker
                    coordinate={paseadorPos}
                    title="🐕 Paseador"
                    description="En ruta"
                  />
                )}
                {clientePos && (
                  <Marker coordinate={clientePos} title="Tu ubicación" pinColor="blue" />
                )}
              </MapView>
            ) : isWeb ? (
              <iframe
                ref={iframeRef}
                title="Mapa seguimiento cliente"
                srcDoc={webMapHtml}
                sandbox="allow-scripts"
                onLoad={sendInitialPosition}
                style={styles.mapWebView}
              />
            ) : (
              <Image
                source={{
                  uri: `https://staticmap.openstreetmap.de/staticmap.php?center=${locOrDefault.latitude},${locOrDefault.longitude}&zoom=14&size=400x250&markers=${locOrDefault.latitude},${locOrDefault.longitude},red-pushpin`,
                }}
                style={styles.mapWebView}
              />
            )}

            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() => setExpanded(!expanded)}
            >
              <Text style={styles.mapBtnText}>
                {expanded ? "✕ Cerrar" : "⛶ Expandir"}
              </Text>
            </TouchableOpacity>

            {!expanded && (
              <Text style={styles.instructions}>
                {paseadorPos
                  ? "🐕 Viendo al paseador"
                  : selectedDirId
                  ? "📍 Toca el mapa para mover el pin a tu puerta"
                  : "Arrastra el pin 📍"}
              </Text>
            )}
          </View>

          {/* ─── DIRECCIONES GUARDADAS ─── */}
          <View style={addrStyles.section}>
            <View style={addrStyles.sectionHeader}>
              <Text style={addrStyles.sectionTitle}>📍 Mis direcciones</Text>
              <TouchableOpacity
                style={addrStyles.addBtn}
                onPress={() => setShowAddressModal(true)}
              >
                <Text style={addrStyles.addBtnTxt}>＋ Agregar</Text>
              </TouchableOpacity>
            </View>

            {direcciones.length === 0 ? (
              <Text style={addrStyles.emptyTxt}>No tienes direcciones guardadas aún.</Text>
            ) : (
              direcciones.map((dir) => {
                const numStr = [
                  dir.numero_exterior ? `#${dir.numero_exterior}` : "",
                  dir.sufijo_numero   ? dir.sufijo_numero          : "",
                  dir.numero_interior ? `Int. ${dir.numero_interior}` : "",
                ].filter(Boolean).join(" ");
                return (
                  <TouchableOpacity
                    key={dir.direccion_id}
                    style={[addrStyles.card, loadingDirId === dir.direccion_id && { opacity: 0.6 }]}
                    onPress={() => loadingDirId ? null : handleSelectDireccion(dir)}
                    activeOpacity={0.75}
                  >
                    <View style={addrStyles.cardBody}>
                      <Text style={addrStyles.cardName}>
                        {dir.nombre_referencia || "Mi dirección"}
                      </Text>
                      <Text style={addrStyles.cardAddr}>
                        {dir.calle}{numStr ? ` ${numStr}` : ""}
                      </Text>
                      {dir.colonia ? (
                        <Text style={addrStyles.cardSub}>
                          {dir.colonia}{dir.codigo_postal ? `, C.P. ${dir.codigo_postal}` : ""}
                        </Text>
                      ) : null}
                      {dir.tipo_vivienda ? (
                        <Text style={addrStyles.cardChip}>
                          {dir.tipo_vivienda.replace(/_/g, " ")}
                        </Text>
                      ) : null}
                      {dir.tiene_caseta ? (
                        <Text style={addrStyles.cardChip}>🔒 Caseta de vigilancia</Text>
                      ) : null}
                    </View>
                    {loadingDirId === dir.direccion_id ? (
                      <ActivityIndicator size="small" color="#22a06b" style={{ marginLeft: 8 }} />
                    ) : (
                      <TouchableOpacity
                        style={addrStyles.deleteBtn}
                        onPress={() => handleDeleteDireccion(dir.direccion_id)}
                      >
                        <Text style={addrStyles.deleteBtnTxt}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* MODAL PASEO FINALIZADO */}
      {estado === "finalizado" && (
        <View style={finStyles.overlay}>
          <Text style={finStyles.title}>✅ ¡Paseo completado!</Text>

          {!calificado ? (
            <>
              <Text style={finStyles.ratingLabel}>Califica al paseador</Text>
              <View style={finStyles.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setRating(n)}>
                    <Text style={[finStyles.star, { color: n <= rating ? "#FFD700" : "#555" }]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={finStyles.comentarioInput}
                placeholder="Comentario (opcional)"
                placeholderTextColor="#aaa"
                value={comentario}
                onChangeText={setComentario}
                multiline
                numberOfLines={2}
              />
              <View style={finStyles.btns}>
                <TouchableOpacity
                  style={[finStyles.btn, { backgroundColor: rating > 0 ? "#FFD700" : "#888", flex: 1 }]}
                  disabled={calificando || rating === 0}
                  onPress={async () => {
                    if (rating === 0) { showToast("Selecciona al menos 1 estrella", "warning"); return; }
                    const usuario = JSON.parse(storage.getItem("usuario") || "{}");
                    const paseadorId = paseadorIdRef.current || servicioData?.paseador_id;
                    if (!paseadorId) { showToast("No se pudo identificar al paseador", "error"); return; }
                    setCalificando(true);
                    try {
                      await apiFetch("/calificacion", {
                        method: "POST",
                        body: JSON.stringify({
                          servicio_id:           servicioId,
                          califica_usuario_id:   usuario.usuario_id,
                          calificado_usuario_id: paseadorId,
                          valor:                 rating,
                          comentario:            comentario,
                        }),
                      });
                      setCalificado(true);
                      showToast("¡Calificación enviada! ⭐", "success");
                    } catch (e) {
                      showToast(e.message || "Error al enviar calificación", "error");
                    } finally {
                      setCalificando(false);
                    }
                  }}
                >
                  {calificando
                    ? <ActivityIndicator color="#1A1A1A" />
                    : <Text style={finStyles.btnTxt}>⭐ Enviar calificación</Text>
                  }
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate("HistorialCliente")}>
                <Text style={finStyles.skipText}>Omitir y ver historial →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={finStyles.calificadoMsg}>{"⭐".repeat(rating)} Calificación enviada</Text>
              <TouchableOpacity
                style={[finStyles.btn, { backgroundColor: "#99D9C1", alignSelf: "stretch", marginTop: 12 }]}
                onPress={() => navigation.navigate("HistorialCliente")}
              >
                <Text style={finStyles.btnTxt}>📋 Ver historial de paseos</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* TARJETA DEL PASEADOR — aparece al ser aceptado */}
      {paseadorInfo && estado !== "esperando" && estado !== "finalizado" && (
        <View style={cardStyles.card}>
          <View style={cardStyles.avatar}>
            <Text style={cardStyles.avatarText}>
              {paseadorInfo.nombre_completo?.charAt(0)?.toUpperCase() || "P"}
            </Text>
          </View>
          <View style={cardStyles.info}>
            <Text style={cardStyles.nombre}>{paseadorInfo.nombre_completo}</Text>
            <Text style={cardStyles.calif}>
              {"⭐".repeat(Math.min(5, Math.round(parseFloat(paseadorInfo.calificacion_promedio) || 0)))}
              {"  "}{(parseFloat(paseadorInfo.calificacion_promedio) || 0).toFixed(1)} / 5
            </Text>
          </View>
          <View style={cardStyles.badge}>
            <Text style={cardStyles.badgeTxt}>
              {estado === "en_camino" ? "🚶 En camino" : "🐾 En paseo"}
            </Text>
          </View>
        </View>
      )}

      {/* DETALLE EN CAMINO — strip con nombre de mascota */}
      {servicioId && estado === "en_camino" && (
        <View style={enCaminoStyles.strip}>
          <View style={enCaminoStyles.dot} />
          <Text style={enCaminoStyles.msg}>
            {mascotaNombre
              ? `Tu paseador va en camino a recoger a ${mascotaNombre}`
              : "Tu paseador va en camino a recoger a tu mascota"}
          </Text>
        </View>
      )}

      {/* BANNER REFINAR UBICACIÓN */}
      {selectedDirId && (
        <View style={refinarStyles.banner}>
          <Text style={refinarStyles.hint}>
            Toca el mapa 📍 en tu puerta exacta, luego toca Guardar
          </Text>
          <View style={refinarStyles.btns}>
            <TouchableOpacity style={refinarStyles.saveBtn} onPress={guardarCoordsExactas}>
              <Text style={refinarStyles.saveTxt}>✓ Guardar ubicación exacta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={refinarStyles.cancelBtn} onPress={() => setSelectedDirId(null)}>
              <Text style={refinarStyles.cancelTxt}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {ToastComponent}

      {/* MODAL AGREGAR DIRECCIÓN */}
      <AgregarDireccionModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSaved={handleAddressSaved}
        onLocationChange={handleLocationFromModal}
        currentLat={clientePos?.latitude ?? lastLocRef.current.latitude}
        currentLng={clientePos?.longitude ?? lastLocRef.current.longitude}
      />

      {/* BARRA INFERIOR CLIENTE */}
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
          onPress={() => navigation.navigate("NotificacionesUsuario")}
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
