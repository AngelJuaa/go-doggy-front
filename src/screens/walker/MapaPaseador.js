import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { styles } from "./MapaPaseadorStyles";
import { requestLocationPermission, getCurrentPosition, watchPosition } from "../../utils/geo";

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

export default function MapaPaseador({ route, navigation }) {
  const { servicioActivoId } = route?.params || {};

  const [miPos, setMiPos]             = useState(null);
  const [miRuta, setMiRuta]           = useState([]);
  const [displayCoords, setDisplayCoords] = useState("Buscando GPS...");
  const [address, setAddress]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [expanded, setExpanded]       = useState(false);
  const [error, setError]             = useState(null);

  const iframeRef  = useRef(null);
  const watchRef   = useRef(null);
  const rutaRef    = useRef([]);
  const isWeb      = Platform.OS === "web";

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

    const walkerIcon = L.divIcon({
      html:'<div style="font-size:28px;line-height:28px">📍</div>',
      className:'', iconSize:[28,28], iconAnchor:[14,28]
    });
    let walkerMarker = null;
    let routeLine = null;

    window.addEventListener('message', function(ev) {
      if (!ev.data || ev.data.type !== 'updateWalker') return;
      const {lat, lng, route} = ev.data;

      if (!walkerMarker) {
        walkerMarker = L.marker([lat, lng], {icon: walkerIcon})
          .addTo(map).bindPopup('📍 Tu posición');
      } else {
        walkerMarker.setLatLng([lat, lng]);
      }
      map.setView([lat, lng], map.getZoom(), {animate: true});

      if (route && route.length > 1) {
        if (routeLine) map.removeLayer(routeLine);
        routeLine = L.polyline(route, {color:'#7CEDA3', weight:4}).addTo(map);
      }
    });
  </script>
</body>
</html>`, []);

  // ─── GPS del paseador ────────────────────────────────────────────────────────
  useEffect(() => {
    const iniciar = async () => {
      const ok = await requestLocationPermission();
      if (!ok) {
        setError("Activa los permisos de ubicación para ver tu posición.");
        setLoading(false);
        return;
      }

      const pos = await getCurrentPosition();
      if (pos) {
        const newPos = { latitude: pos.lat, longitude: pos.lng };
        setMiPos(newPos);
        setDisplayCoords(`Lat: ${pos.lat.toFixed(6)}\nLng: ${pos.lng.toFixed(6)}`);
        setLoading(false);
      }

      watchRef.current = await watchPosition(
        ({ lat, lng }) => {
          const newPos = { latitude: lat, longitude: lng };
          setMiPos(newPos);
          rutaRef.current = [...rutaRef.current, [lat, lng]];
          setMiRuta([...rutaRef.current]);
          setDisplayCoords(`Lat: ${lat.toFixed(6)}\nLng: ${lng.toFixed(6)}`);
          setLoading(false);
          iframeRef.current?.contentWindow?.postMessage({
            type:  "updateWalker",
            lat,
            lng,
            route: rutaRef.current,
          }, "*");
        },
        (err) => {
          console.warn("GPS error:", err?.message);
          setLoading(false);
        }
      );
    };

    iniciar();
    return () => {
      if (watchRef.current) watchRef.current.remove();
    };
  }, [isWeb]);

  // ─── Geocoding de la posición del paseador ───────────────────────────────────
  useEffect(() => {
    if (!miPos) return;
    let active = true;
    const fetch_ = async () => {
      setAddress(null);
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${miPos.latitude}&lon=${miPos.longitude}&zoom=18&addressdetails=1&accept-language=es`
        );
        const data = await resp.json();
        if (!active) return;
        const a = data.address || {};
        const street = a.road || a.street || a.residential || a.pedestrian ||
          a.neighbourhood || a.suburb || a.town || a.city || null;
        const num = a.house_number ? ` ${a.house_number}` : "";
        setAddress(street ? `${street}${num}` : null);
        setDisplayCoords(
          `Lat: ${miPos.latitude.toFixed(6)}\nLng: ${miPos.longitude.toFixed(6)}`
        );
      } catch {
        setAddress(null);
      }
    };
    fetch_();
    return () => { active = false; };
  }, [miPos]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const locOrDefault = miPos || DEFAULT_LOCATION;
  const region = {
    latitude:      locOrDefault.latitude,
    longitude:     locOrDefault.longitude,
    latitudeDelta: 0.02,
    longitudeDelta:0.02,
  };
  const nativeRoute = miRuta.map(p => ({ latitude: p[0], longitude: p[1] }));

  const sendInitialPosition = () => {
    if (miPos) {
      iframeRef.current?.contentWindow?.postMessage({
        type:  "updateWalker",
        lat:   miPos.latitude,
        lng:   miPos.longitude,
        route: rutaRef.current,
      }, "*");
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>
        {servicioActivoId ? "🐾 Paseo activo" : "📍 Mi ubicación"}
      </Text>

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#99D9C1" />
          <Text style={styles.loadingText}>Buscando GPS...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* CAJA DE UBICACIÓN */}
          <View style={styles.locationBox}>
            <Text style={styles.locationTitle}>
              {servicioActivoId ? "🐾 En paseo — GPS activo" : "📍 Tu posición actual"}
            </Text>
            {address ? <Text style={styles.addressText}>{address}</Text> : null}
            <Text style={styles.coords}>{displayCoords}</Text>
            {miRuta.length > 0 ? (
              <Text style={[styles.coords, { marginTop: 4 }]}>
                📏 Puntos registrados: {miRuta.length}
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
                    strokeColor="#7CEDA3"
                    strokeWidth={4}
                  />
                )}
                {miPos && (
                  <Marker coordinate={miPos} title="📍 Tu posición" pinColor="green" />
                )}
              </MapView>
            ) : isWeb ? (
              <iframe
                ref={iframeRef}
                title="Mapa paseador"
                srcDoc={webMapHtml}
                sandbox="allow-scripts"
                onLoad={sendInitialPosition}
                style={styles.mapWebView}
              />
            ) : (
              <Image
                source={{
                  uri: `https://staticmap.openstreetmap.de/staticmap.php?center=${locOrDefault.latitude},${locOrDefault.longitude}&zoom=15&size=400x250&markers=${locOrDefault.latitude},${locOrDefault.longitude},red-pushpin`,
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
                {servicioActivoId ? "🐾 GPS activo" : "📍 Tu ubicación"}
              </Text>
            )}
          </View>
        </ScrollView>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* BARRA INFERIOR PASEADOR — 4 tabs */}
      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("Inicio_paseador")}>
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={styles.tabLabel}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("PaseosPaseador")}>
          <Text style={styles.tabIcon}>✅</Text>
          <Text style={styles.tabLabel}>Paseos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("NotificacionesPaseador")}>
          <Text style={styles.tabIcon}>🔔</Text>
          <Text style={styles.tabLabel}>Notificaciones</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("PerfilPaseador")}>
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={styles.tabLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
