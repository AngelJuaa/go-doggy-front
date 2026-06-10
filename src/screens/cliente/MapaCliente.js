import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { styles } from "./MapaClienteStyles";
import { getSocket } from "../../utils/socket";

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

  const watchIdRef  = useRef(null);
  const iframeRef   = useRef(null);
  const lastLocRef  = useRef(DEFAULT_LOCATION);
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
      }

      if (d.type === 'updatePaseador') {
        if (!paseadorMarker) {
          paseadorMarker = L.marker([d.lat, d.lng], {icon:paseadorIcon})
            .addTo(map).bindPopup('🐕 Paseador');
        } else {
          paseadorMarker.setLatLng([d.lat, d.lng]);
        }
        map.setView([d.lat, d.lng], map.getZoom(), {animate:true});
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

  // ─── Socket: seguimiento del paseador en tiempo real ─────────────────────────
  useEffect(() => {
    if (!servicioId) return;
    socket.emit("cliente:watch", { servicioId });

    socket.on("servicio:aceptado", () => {
      setEstado("en_camino");
      Alert.alert("¡Paseador en camino!", "El paseador aceptó tu solicitud y va hacia ti.");
    });

    socket.on("paseador:location", (coord) => {
      setPaseadorPos({ latitude: coord.lat, longitude: coord.lng });
      rutaRef.current = [...rutaRef.current, [coord.lat, coord.lng]];
      setRutaPaseador([...rutaRef.current]);
      setEstado("activo");
      iframeRef.current?.contentWindow?.postMessage({
        type:  "updatePaseador",
        lat:   coord.lat,
        lng:   coord.lng,
        route: rutaRef.current,
      }, "*");
    });

    socket.on("servicio:finalizado", () => {
      setEstado("finalizado");
      Alert.alert("¡Paseo completado!", "El paseo ha finalizado.", [
        { text: "Calificar", onPress: () => navigation.navigate("Calificaciones") },
        { text: "Inicio",    onPress: () => navigation.navigate("Inicio_cliente") },
      ]);
    });

    return () => {
      socket.off("servicio:aceptado");
      socket.off("paseador:location");
      socket.off("servicio:finalizado");
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
                {paseadorPos ? "🐕 Viendo al paseador" : "Arrastra el pin 📍"}
              </Text>
            )}
          </View>
        </ScrollView>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
