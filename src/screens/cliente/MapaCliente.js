import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import storage from "../../utils/storage";
import { API_URL } from "../../utils/api";
import { useFocusEffect } from "@react-navigation/native";

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

const DIRECCION_SELECCIONADA_KEY = "direccion_mapa_seleccionada";

const getDireccionLabel = (direccion) => {
  if (!direccion) return null;

  const calle = direccion.calle || "Sin calle";
  const numero = direccion.numero_calle || direccion.numero_externo || "";
  const colonia = direccion.colonia || "";

  return `${calle}${numero ? ` #${numero}` : ""}${colonia ? ` · ${colonia}` : ""}`;
};

const getDireccionCoords = (direccion) => {
  const latitude = Number(direccion?.latitud);
  const longitude = Number(direccion?.longitud);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
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

export default function MapaCliente({ route, navigation }) {
  const { servicioId } = route?.params || {};
  const refreshDirecciones = route?.params?.refreshDirecciones;

  const [hoveredTab, setHoveredTab]   = useState(null);
  const [clientePos, setClientePos]   = useState(null);
  const [gpsPos, setGpsPos]           = useState(null);
  const [paseadorPos, setPaseadorPos] = useState(null);
  const [rutaPaseador, setRutaPaseador] = useState([]);
  const direccionSeleccionadaInicial = readSelectedDireccion();
  const direccionSeleccionadaInicialCoords = getDireccionCoords(direccionSeleccionadaInicial);
  const [direccionSeleccionadaId, setDireccionSeleccionadaId] = useState(
    direccionSeleccionadaInicial?.direccion_id || null
  );
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(
    direccionSeleccionadaInicial || null
  );
  const [displayCoords, setDisplayCoords] = useState(
    direccionSeleccionadaInicialCoords
      ? `Lat: ${direccionSeleccionadaInicialCoords.latitude.toFixed(6)}\nLng: ${direccionSeleccionadaInicialCoords.longitude.toFixed(6)}`
      : "Esperando ubicación..."
  );
  const [address, setAddress]   = useState(
    direccionSeleccionadaInicial ? getDireccionLabel(direccionSeleccionadaInicial) : null
  );
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [savedExpanded, setSavedExpanded] = useState(false);
  const [usuarioId, setUsuarioId] = useState(null);
  const [direccionesGuardadas, setDireccionesGuardadas] = useState([]);
  const [loadingDirecciones, setLoadingDirecciones] = useState(false);
  const [errorDirecciones, setErrorDirecciones] = useState(null);
  const [estado, setEstado]     = useState("esperando");
  const [error, setError]       = useState(null);

  const watchIdRef  = useRef(null);
  const iframeRef   = useRef(null);
  const mapRef      = useRef(null);
  const lastLocRef  = useRef(DEFAULT_LOCATION);
  const rutaRef     = useRef([]);
  const direccionSeleccionadaIdRef = useRef(direccionSeleccionadaInicial?.direccion_id || null);
  const direccionSeleccionadaActivaRef = useRef(Boolean(direccionSeleccionadaInicial));
  const isWeb       = Platform.OS === "web";
  const socket      = getSocket();

  useEffect(() => {
    const usuarioGuardado = storage.getItem("usuario");
    if (!usuarioGuardado) return;

    try {
      const usuario = JSON.parse(usuarioGuardado);
      setUsuarioId(usuario.usuario_id || null);
    } catch (e) {
      setUsuarioId(null);
    }
  }, []);

  const cargarDireccionesGuardadas = async () => {
    if (!usuarioId) {
      setDireccionesGuardadas([]);
      setErrorDirecciones("No se encontro el usuario guardado.");
      return;
    }

    setLoadingDirecciones(true);
    setErrorDirecciones(null);

    try {
      const response = await fetch(`${API_URL}/direccion/usuario/${usuarioId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudieron cargar las direcciones");
      }

      const direcciones = Array.isArray(data) ? data : [];
      setDireccionesGuardadas(direcciones);

      const seleccionActual = storage.getItem(DIRECCION_SELECCIONADA_KEY);
      if (seleccionActual) {
        try {
          const seleccionParseada = JSON.parse(seleccionActual);
          const seleccionId = Number(seleccionParseada?.direccion_id);
          const direccionActiva = direcciones.find(
            (item) => Number(item.direccion_id) === seleccionId
          );

          if (!direccionActiva) {
            storage.removeItem(DIRECCION_SELECCIONADA_KEY);
            direccionSeleccionadaIdRef.current = null;
            direccionSeleccionadaActivaRef.current = false;
            setDireccionSeleccionadaId(null);
            setDireccionSeleccionada(null);

            if (gpsPos) {
              setClientePos(gpsPos);
              setDisplayCoords(
                `Lat: ${gpsPos.latitude.toFixed(6)}\nLng: ${gpsPos.longitude.toFixed(6)}`
              );
              setAddress(null);
              iframeRef.current?.contentWindow?.postMessage(
                { type: "updateCliente", lat: gpsPos.latitude, lng: gpsPos.longitude },
                "*"
              );
            }
          }
        } catch (error) {
          storage.removeItem(DIRECCION_SELECCIONADA_KEY);
        }
      }
    } catch (error) {
      console.error("❌ Error cargando direcciones:", error);
      setErrorDirecciones("No se pudieron cargar las direcciones guardadas.");
      setDireccionesGuardadas([]);
    } finally {
      setLoadingDirecciones(false);
    }
  };

  const toggleSavedExpanded = async () => {
    const next = !savedExpanded;
    setSavedExpanded(next);
    if (next && direccionesGuardadas.length === 0 && !loadingDirecciones) {
      await cargarDireccionesGuardadas();
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (usuarioId) {
        cargarDireccionesGuardadas();
      }
    }, [usuarioId, refreshDirecciones])
  );

  const aplicarDireccionSeleccionada = (direccion) => {
    const coords = getDireccionCoords(direccion);

    if (!coords) {
      Alert.alert("Direccion sin coordenadas", "Esta direccion no tiene latitud/longitud guardadas.");
      return;
    }

    const direccionId = Number(direccion.direccion_id) || null;
    direccionSeleccionadaIdRef.current = direccionId;
    direccionSeleccionadaActivaRef.current = true;
    setDireccionSeleccionadaId(direccionId);
    setDireccionSeleccionada(direccion);
    setClientePos(coords);
    setDisplayCoords(`Lat: ${coords.latitude.toFixed(6)}\nLng: ${coords.longitude.toFixed(6)}`);
    setAddress(getDireccionLabel(direccion));
    setError(null);
    storage.setItem(DIRECCION_SELECCIONADA_KEY, JSON.stringify(direccion));

    if (mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion(
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }

    iframeRef.current?.contentWindow?.postMessage(
      { type: "updateCliente", lat: coords.latitude, lng: coords.longitude },
      "*"
    );

    Alert.alert("Direccion seleccionada", "El mapa se actualizo con esa ubicacion.");
  };

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
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{
      maxZoom:20,
      subdomains:'abcd',
      attribution:'&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    // Marcador del cliente (badge moderno y arrastrable)
    const clienteIcon = L.divIcon({
      className:'',
      iconSize:[30,30],
      iconAnchor:[15,30],
      html:'<div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(145deg,#2dd4bf,#0ea5a3);border:3px solid #ffffff;box-shadow:0 8px 18px rgba(14,165,163,.35);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">C</div>'
    });
    const clienteMarker = L.marker([${DEFAULT_LOCATION.latitude},${DEFAULT_LOCATION.longitude}],
      {icon:clienteIcon, draggable:true}).addTo(map).bindPopup('📍 Tu ubicación');

    clienteMarker.on('dragend', function(ev) {
      const {lat, lng} = ev.target.getLatLng();
      window.parent.postMessage({type:'markerMoved', latitude:lat, longitude:lng}, '*');
    });

    // Marcador del paseador (badge azul)
    const paseadorIcon = L.divIcon({
      className:'',
      iconSize:[32,32],
      iconAnchor:[16,32],
      html:'<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(145deg,#60a5fa,#2563eb);border:3px solid #ffffff;box-shadow:0 8px 18px rgba(37,99,235,.35);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">P</div>'
    });
    let paseadorMarker = null;
    let routeLine = null;

    // Escuchar mensajes del padre para actualizar posiciones
    window.addEventListener('message', function(ev) {
      if (!ev.data) return;
      const d = ev.data;

      if (d.type === 'updateCliente') {
        clienteMarker.setLatLng([d.lat, d.lng]);
        map.setView([d.lat, d.lng], map.getZoom(), {animate:true});
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
          routeLine = L.polyline(d.route, {
            color:'#0f766e',
            weight:5,
            opacity:0.9,
            lineJoin:'round',
            dashArray:'10, 8'
          }).addTo(map);
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
      setGpsPos(pos);

      if (!direccionSeleccionadaActivaRef.current) {
        setClientePos(pos);
        setDisplayCoords(`Lat: ${latitude.toFixed(6)}\nLng: ${longitude.toFixed(6)}`);
      }

      setLoading(false);
      setError(null);

      if (!direccionSeleccionadaActivaRef.current) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "updateCliente", lat: latitude, lng: longitude }, "*"
        );
      }
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

  useEffect(() => {
    if (!direccionSeleccionadaIdRef.current || direccionesGuardadas.length === 0) {
      return;
    }

    const direccionActiva = direccionesGuardadas.find(
      (item) => Number(item.direccion_id) === Number(direccionSeleccionadaIdRef.current)
    );

    if (direccionActiva) {
      setDireccionSeleccionada(direccionActiva);
      const coords = getDireccionCoords(direccionActiva);
      if (coords) {
        setClientePos(coords);
        setDisplayCoords(`Lat: ${coords.latitude.toFixed(6)}\nLng: ${coords.longitude.toFixed(6)}`);
        setAddress(getDireccionLabel(direccionActiva));
        iframeRef.current?.contentWindow?.postMessage(
          { type: "updateCliente", lat: coords.latitude, lng: coords.longitude },
          "*"
        );
      }
      return;
    }

    storage.removeItem(DIRECCION_SELECCIONADA_KEY);
    direccionSeleccionadaIdRef.current = null;
    direccionSeleccionadaActivaRef.current = false;
    setDireccionSeleccionadaId(null);
    setDireccionSeleccionada(null);

    if (gpsPos) {
      setClientePos(gpsPos);
      setDisplayCoords(`Lat: ${gpsPos.latitude.toFixed(6)}\nLng: ${gpsPos.longitude.toFixed(6)}`);
      setAddress(null);
      iframeRef.current?.contentWindow?.postMessage(
        { type: "updateCliente", lat: gpsPos.latitude, lng: gpsPos.longitude },
        "*"
      );
    }
  }, [direccionesGuardadas, direccionSeleccionadaId, gpsPos]);

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
    if (direccionSeleccionadaActivaRef.current) {
      return;
    }
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

  useEffect(() => {
    if (!iframeRef.current?.contentWindow || !clientePos) return;
    iframeRef.current.contentWindow.postMessage(
      { type: "updateCliente", lat: clientePos.latitude, lng: clientePos.longitude },
      "*"
    );
  }, [clientePos]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const locOrDefault = clientePos || DEFAULT_LOCATION;
  const region = {
    latitude:      locOrDefault.latitude,
    longitude:     locOrDefault.longitude,
    latitudeDelta: 0.05,
    longitudeDelta:0.05,
  };
  const nativeRoute = rutaPaseador.map(p => ({ latitude: p[0], longitude: p[1] }));

  const handleAddStartLocation = () => {
    navigation.navigate("AgregarDireccionCliente");
  };

  const irDetalleDireccion = (direccion) => {
    navigation.navigate("verDireccionClienteDetalles", { direccion });
  };

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

            <TouchableOpacity
              style={styles.savedToggleBtn}
              onPress={toggleSavedExpanded}
            >
              <Text style={styles.savedToggleText}>Direcciones guardadas</Text>
              <Text style={styles.savedToggleChevron}>{savedExpanded ? "▲" : "▼"}</Text>
            </TouchableOpacity>

            {savedExpanded ? (
              <View style={styles.savedListBox}>
                {loadingDirecciones ? (
                  <View style={styles.savedListState}>
                    <ActivityIndicator size="small" color="#99D9C1" />
                    <Text style={styles.savedListStateText}>Cargando direcciones...</Text>
                  </View>
                ) : errorDirecciones ? (
                  <Text style={styles.savedListStateText}>{errorDirecciones}</Text>
                ) : direccionesGuardadas.length === 0 ? (
                  <Text style={styles.savedListStateText}>No hay direcciones guardadas.</Text>
                ) : (
                  direccionesGuardadas.map((direccion, index) => (
                    <View key={direccion.direccion_id || index} style={styles.savedItem}>
                      <TouchableOpacity
                        style={[
                          styles.savedItemUseBtn,
                          Number(direccionSeleccionadaId) === Number(direccion.direccion_id) && styles.savedItemUseBtnActive,
                        ]}
                        onPress={() => aplicarDireccionSeleccionada(direccion)}
                      >
                        <Text
                          style={[
                            styles.savedItemUseText,
                            Number(direccionSeleccionadaId) === Number(direccion.direccion_id) && styles.savedItemUseTextActive,
                          ]}
                        >
                          {Number(direccionSeleccionadaId) === Number(direccion.direccion_id) ? "Usando" : "Usar"}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.savedItemTextWrap}>
                        <Text style={styles.savedItemTitle} numberOfLines={1}>
                          {getDireccionLabel(direccion)}
                        </Text>
                        {Number(direccionSeleccionadaId) === Number(direccion.direccion_id) ? (
                          <Text style={styles.savedItemSelectedBadge}>Seleccionada para el mapa</Text>
                        ) : null}
                      </View>
                      <TouchableOpacity
                        style={styles.savedItemArrowBtn}
                        onPress={() => irDetalleDireccion(direccion)}
                      >
                        <Text style={styles.savedItemArrow}>▶</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </View>

          {/* CONTENEDOR DEL MAPA */}
          <View style={[styles.mapContainer, expanded && styles.mapContainerExpanded]}>
            {MapView && Marker && Polyline && !isWeb ? (
              <MapView
                ref={mapRef}
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

          <TouchableOpacity style={styles.addButton} onPress={handleAddStartLocation}>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
          <Text style={styles.addButtonLabel}>Agregar direccion</Text>
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
