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
  Modal,
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
const ESPERA_ENTREGA_KEY = "espera_entrega_inicial";

const UBER_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f5f7fb" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 2 }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dce8f2" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#f2f2f2" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ffffff" }, { weight: 2.2 }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ffffff" }, { weight: 1.6 }] },
  { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#ffffff" }, { weight: 1.2 }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#cbd5e1" }, { weight: 1.4 }] },
];

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
  const mostrarEntregaFinal = route?.params?.mostrarEntregaFinal;
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
  const [showPaseadorCancelado, setShowPaseadorCancelado] = useState(false);
  const [mensajeCancelacion, setMensajeCancelacion] = useState("El viaje fue cancelado.");
  const [prorrogaEntregaExpiraEn, setProrrogaEntregaExpiraEn] = useState(null);
  const [prorrogaAhora, setProrrogaAhora] = useState(Date.now());
  const [showEntregaModal, setShowEntregaModal] = useState(false);
  const [faseEntrega, setFaseEntrega] = useState("recogida");
  const [pasoEntregaInicial, setPasoEntregaInicial] = useState("llegada");
  const [respuestaEntregaExpiraEn, setRespuestaEntregaExpiraEn] = useState(null);
  const [respuestaEntregaAhora, setRespuestaEntregaAhora] = useState(Date.now());
  const [esperaEntregaExpiraEn, setEsperaEntregaExpiraEn] = useState(() => {
    const valor = Number(storage.getItem(ESPERA_ENTREGA_KEY));
    return Number.isFinite(valor) && valor > Date.now() ? valor : null;
  });
  const [esperaEntregaAhora, setEsperaEntregaAhora] = useState(Date.now());
  const [isMapInteracting, setIsMapInteracting] = useState(false);
  const [paseadorInfo, setPaseadorInfo] = useState(null);
  const [calificacionPromedio, setCalificacionPromedio] = useState(null);
  const [pinMovido, setPinMovido] = useState(false);
  const [pinLocationMovida, setPinLocationMovida] = useState(null);

  const watchIdRef  = useRef(null);
  const iframeRef   = useRef(null);
  const mapRef      = useRef(null);
  const lastLocRef  = useRef(DEFAULT_LOCATION);
  const rutaRef     = useRef([]);
  const finalRedirectTimeoutRef = useRef(null);
  const finalRedirectScheduledRef = useRef(false);
  const entregaInicialPendienteRef = useRef(false);
  const direccionSeleccionadaIdRef = useRef(direccionSeleccionadaInicial?.direccion_id || null);
  const direccionSeleccionadaActivaRef = useRef(Boolean(direccionSeleccionadaInicial));
  const isWeb       = Platform.OS === "web";
  const socket      = getSocket();

  useEffect(() => {
    if (!showPaseadorCancelado) return;
    const timeoutId = setTimeout(() => {
      setShowPaseadorCancelado(false);
      navigation.reset({ index: 0, routes: [{ name: "Inicio_cliente" }] });
    }, 10000);
    return () => clearTimeout(timeoutId);
  }, [showPaseadorCancelado, navigation]);

  const scheduleFinalRedirect = useCallback(() => {
    const activeRole = storage.getItem("active_role");
    const usuarioGuardado = storage.getItem("usuario");

    if (activeRole !== "cliente" || !usuarioGuardado) {
      finalRedirectScheduledRef.current = false;
      if (finalRedirectTimeoutRef.current) {
        clearTimeout(finalRedirectTimeoutRef.current);
        finalRedirectTimeoutRef.current = null;
      }
      return;
    }

    try {
      const usuarioActual = JSON.parse(usuarioGuardado);
      const usuarioActualId = Number(usuarioActual?.usuario_id || 0);
      const usuarioMapaId = Number(usuarioId || 0);

      if (usuarioMapaId > 0 && usuarioActualId > 0 && usuarioMapaId !== usuarioActualId) {
        finalRedirectScheduledRef.current = false;
        if (finalRedirectTimeoutRef.current) {
          clearTimeout(finalRedirectTimeoutRef.current);
          finalRedirectTimeoutRef.current = null;
        }
        return;
      }
    } catch (error) {
      finalRedirectScheduledRef.current = false;
      if (finalRedirectTimeoutRef.current) {
        clearTimeout(finalRedirectTimeoutRef.current);
        finalRedirectTimeoutRef.current = null;
      }
      return;
    }

    if (finalRedirectScheduledRef.current) return;
    finalRedirectScheduledRef.current = true;

    finalRedirectTimeoutRef.current = setTimeout(() => {
      const activeRoleNow = storage.getItem("active_role");
      const usuarioNow = storage.getItem("usuario");
      if (activeRoleNow !== "cliente" || !usuarioNow) {
        return;
      }

      try {
        const usuarioActual = JSON.parse(usuarioNow);
        const usuarioActualId = Number(usuarioActual?.usuario_id || 0);
        const usuarioMapaId = Number(usuarioId || 0);

        if (usuarioMapaId > 0 && usuarioActualId > 0 && usuarioMapaId !== usuarioActualId) {
          return;
        }
      } catch (error) {
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: "Inicio_cliente" }],
      });
    }, 5000);
  }, [navigation, usuarioId]);

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
          const seleccionTemporal = String(seleccionParseada?.direccion_id || "").startsWith("temp_");
          if (seleccionTemporal) return;

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

  useEffect(() => {
    if (!mostrarEntregaFinal || !servicioId) return;
    entregaInicialPendienteRef.current = true;
    setFaseEntrega("final");
    setShowEntregaModal(true);
    navigation.setParams({ mostrarEntregaFinal: false });
  }, [mostrarEntregaFinal, servicioId, navigation]);

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
    setGpsPos(coords);
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

  const usarUbicacionMovida = () => {
    if (!pinLocationMovida) return;

    const nuevaDireccion = {
      direccion_id: `temp_${Date.now()}`,
      latitud: pinLocationMovida.latitude,
      longitud: pinLocationMovida.longitude,
      calle: "Ubicación custom",
      numero_calle: "",
      colonia: "Seleccionada en el mapa",
    };

    setDireccionSeleccionadaId(nuevaDireccion.direccion_id);
    setDireccionSeleccionada(nuevaDireccion);
    setAddress("📍 Ubicación personalizada");
    setError(null);
    setPinMovido(false);
    setPinLocationMovida(null);
    storage.setItem(DIRECCION_SELECCIONADA_KEY, JSON.stringify(nuevaDireccion));

    Alert.alert("Ubicación guardada", "La ubicación del mapa se ha guardado correctamente.");
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
    const map = L.map('map', { zoomControl: false }).setView([${DEFAULT_LOCATION.latitude},${DEFAULT_LOCATION.longitude}], 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: ['a', 'b', 'c', 'd'],
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    map.attributionControl.setPrefix(false);

    let userMoved = false;
    map.on('dragstart', () => { userMoved = true; });
    map.on('zoomstart', () => { userMoved = true; });
    map.on('movestart', () => { userMoved = true; });
    map.scrollWheelZoom.enable();
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();

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
        console.log('[MapaCliente ubicación] iframe recibió updateCliente', {
          lat: d.lat,
          lng: d.lng,
        });
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
        if (!userMoved) {
          map.setView([d.lat, d.lng], map.getZoom(), {animate:true});
        }
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

      if (d.type === 'clearPaseador') {
        if (paseadorMarker) {
          map.removeLayer(paseadorMarker);
          paseadorMarker = null;
        }
        if (routeLine) {
          map.removeLayer(routeLine);
          routeLine = null;
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

  const cargarEstadoServicio = useCallback(async () => {
    if (!servicioId) return;

    try {
      const response = await fetch(`${API_URL}/servicio/${servicioId}`);
      if (!response.ok) return;
      const servicio = await response.json();

      if (servicio?.paseador_id) {
        setPaseadorInfo({
          paseador_id: servicio.paseador_id,
          nombre: servicio.paseador_nombre || "Paseador",
          apellido: servicio.paseador_apellido || "",
          biografia: servicio.paseador_biografia || "",
          url_foto_perfil: servicio.paseador_url_foto_perfil || null,
        });
        fetch(`${API_URL}/paseador/${servicio.paseador_id}/calificaciones`)
          .then((response) => response.ok ? response.json() : [])
          .then((reseñas) => {
            const filas = Array.isArray(reseñas) ? reseñas : [];
            const promedio = filas.length
              ? filas.reduce((total, reseña) => total + (Number(reseña.promedio) || 0), 0) / filas.length
              : 0;
            setCalificacionPromedio(promedio);
          })
          .catch(() => setCalificacionPromedio(0));
      }

      if (servicio?.estado) {
        if (servicio.estado === "en_camino" || servicio.estado === "activo") {
          setEstado("en_camino");
        } else if (servicio.estado === "finalizado") {
          setEstado("finalizado");
        } else {
          setEstado(servicio.estado);
        }
      }

      if ((servicio.estado === "en_camino" || servicio.estado === "activo") && !paseadorPos) {
        const rutaRes = await fetch(`${API_URL}/servicio/${servicioId}/ruta`);
        if (rutaRes.ok) {
          const ruta = await rutaRes.json();
          if (Array.isArray(ruta) && ruta.length > 0) {
            rutaRef.current = ruta.map((item) => [Number(item.latitud), Number(item.longitud)]);
            setRutaPaseador(rutaRef.current);
            const ultimo = rutaRef.current[rutaRef.current.length - 1];
            if (ultimo && Number.isFinite(ultimo[0]) && Number.isFinite(ultimo[1])) {
              const coords = { latitude: ultimo[0], longitude: ultimo[1] };
              setPaseadorPos(coords);
              iframeRef.current?.contentWindow?.postMessage({
                type: "updatePaseador",
                lat: coords.latitude,
                lng: coords.longitude,
                route: rutaRef.current,
              }, "*");
            }
          }
        }
      }
    } catch (error) {
      console.warn("No se pudo cargar estado del servicio:", error);
    }
  }, [servicioId, paseadorPos]);

  // ─── Socket: seguimiento del paseador en tiempo real ─────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!servicioId) return;
      entregaInicialPendienteRef.current = false;
      setShowEntregaModal(false);
      cargarEstadoServicio();
      socket.emit("cliente:watch", { servicioId });

      const handleServicioAceptado = () => {
        setEstado("en_camino");
        Alert.alert("¡Paseador en camino!", "El paseador aceptó tu solicitud y va hacia ti.");
      };

      const handleServicioActivo = (payload) => {
        if (Number(payload?.servicio_id || 0) !== Number(servicioId)) return;
        setEstado("activo");
      };

      const handlePaseadorLocation = (coord) => {
        setPaseadorPos({ latitude: coord.lat, longitude: coord.lng });
        rutaRef.current = [...rutaRef.current, [coord.lat, coord.lng]];
        setRutaPaseador([...rutaRef.current]);
        iframeRef.current?.contentWindow?.postMessage({
          type:  "updatePaseador",
          lat:   coord.lat,
          lng:   coord.lng,
          route: rutaRef.current,
        }, "*");
      };

      const handleServicioFinalizado = (payload) => {
        const montoAdicional = Number(payload?.monto_adicional || 0);
        const distanciaMetros = Number(payload?.distancia_metros || 0);
        const montoBase = Number(payload?.costo_total || 0);
        const montoTotal = Number(
          payload?.monto_total || (montoBase + montoAdicional).toFixed(2)
        );

        navigation.reset({
          index: 0,
          routes: [{
            name: "MercadoPago",
            params: {
              servicioId,
              paseadorId: payload?.paseador_id,
              tarifa_base_hora: montoTotal,
              tipo_servicio: payload?.tipo_servicio || "Paseo",
              duracion_minutos: payload?.duracion_minutos || null,
              tipoCobro: "distancia",
              distanciaMetros,
              montoAdicional,
              montoBase,
            },
          }],
        });
      };

      const handleServicioCancelado = (payload) => {
        if (Number(payload?.servicio_id || 0) !== Number(servicioId)) return;

        rutaRef.current = [];
        setRutaPaseador([]);
        setPaseadorPos(null);
        setEstado("esperando");
        setMensajeCancelacion(payload?.mensaje_cliente || "El viaje fue cancelado.");
        setEsperaEntregaExpiraEn(null);
        storage.removeItem(ESPERA_ENTREGA_KEY);
        iframeRef.current?.contentWindow?.postMessage({
          type: "clearPaseador",
        }, "*");
        setShowPaseadorCancelado(true);
      };

      const handleProrrogaEntrega = (payload) => {
        if (Number(payload?.servicio_id || 0) !== Number(servicioId)) return;
        setProrrogaEntregaExpiraEn(Date.now() + Number(payload?.segundos_restantes || 120) * 1000);
      };

      const handleAlertaEntrega = (payload) => {
        if (Number(payload?.servicio_id || 0) !== Number(servicioId)) return;
        setProrrogaEntregaExpiraEn(null);
        setMensajeCancelacion(payload?.mensaje_cliente || "El paseador ha sido alertado, tiene 1 hora para la entrega de tus mascotas.");
        setShowPaseadorCancelado(true);
      };

      const handlePaseadorPorLlegar = (payload) => {
        if (Number(payload?.servicio_id || 0) !== Number(servicioId)) return;
        Alert.alert("Paseador por llegar", "El paseador está por llegar.");
      };

      const handleSolicitudEntrega = (payload) => {
        if (
          Number(payload?.servicio_id || 0) !== Number(servicioId) ||
          entregaInicialPendienteRef.current
        ) return;

        entregaInicialPendienteRef.current = true;
        setFaseEntrega(payload?.fase === "final" ? "final" : "recogida");
        if (payload?.fase !== "final") {
          setPasoEntregaInicial("llegada");
          setRespuestaEntregaExpiraEn(Date.now() + 10 * 1000);
          const segundosRestantes = Number(payload?.segundos_restantes);
          if (Number.isFinite(segundosRestantes)) {
            const expiraEn = Date.now() + segundosRestantes * 1000;
            setEsperaEntregaExpiraEn(expiraEn);
            storage.setItem(ESPERA_ENTREGA_KEY, String(expiraEn));
          }
        }
        setShowEntregaModal(true);
      };

      socket.on("servicio:aceptado", handleServicioAceptado);
      socket.on("cliente:servicio:activo", handleServicioActivo);
      socket.on("paseador:location", handlePaseadorLocation);
      socket.on("servicio:finalizado", handleServicioFinalizado);
      socket.on("cliente:paseador:por-llegar", handlePaseadorPorLlegar);
      socket.on("cliente:entrega:solicitud", handleSolicitudEntrega);
      socket.on("servicio:cancelado", handleServicioCancelado);
      socket.on("cliente:entrega:prorroga", handleProrrogaEntrega);
      socket.on("cliente:entrega:alerta", handleAlertaEntrega);

      return () => {
        socket.off("servicio:aceptado", handleServicioAceptado);
        socket.off("cliente:servicio:activo", handleServicioActivo);
        socket.off("paseador:location", handlePaseadorLocation);
        socket.off("servicio:finalizado", handleServicioFinalizado);
        socket.off("cliente:paseador:por-llegar", handlePaseadorPorLlegar);
        socket.off("cliente:entrega:solicitud", handleSolicitudEntrega);
        socket.off("servicio:cancelado", handleServicioCancelado);
        socket.off("cliente:entrega:prorroga", handleProrrogaEntrega);
        socket.off("cliente:entrega:alerta", handleAlertaEntrega);
      };
    }, [servicioId, socket, navigation, cargarEstadoServicio])
  );

  useEffect(() => {
    if (!prorrogaEntregaExpiraEn) return;
    const intervalId = setInterval(() => setProrrogaAhora(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [prorrogaEntregaExpiraEn]);

    useEffect(() => {
      if (!respuestaEntregaExpiraEn || faseEntrega !== "recogida") return;

      const actualizarRespuesta = () => {
        const ahora = Date.now();
        setRespuestaEntregaAhora(ahora);
        if (ahora < respuestaEntregaExpiraEn) return;

        entregaInicialPendienteRef.current = false;
        setShowEntregaModal(false);
        setRespuestaEntregaExpiraEn(null);
        socket.emit("cliente:mascotas:no-entregadas", { servicioId });
      };

      actualizarRespuesta();
      const intervalId = setInterval(actualizarRespuesta, 1000);
      return () => clearInterval(intervalId);
    }, [respuestaEntregaExpiraEn, faseEntrega, servicioId, socket]);

  useEffect(() => {
    if (!esperaEntregaExpiraEn) return;
    const actualizarEspera = () => {
      const ahora = Date.now();
      setEsperaEntregaAhora(ahora);
      if (ahora >= esperaEntregaExpiraEn) {
        setEsperaEntregaExpiraEn(null);
        storage.removeItem(ESPERA_ENTREGA_KEY);
      }
    };
    actualizarEspera();
    const intervalId = setInterval(actualizarEspera, 1000);
    return () => clearInterval(intervalId);
  }, [esperaEntregaExpiraEn]);

  useEffect(() => {
    return () => {
      if (finalRedirectTimeoutRef.current) {
        clearTimeout(finalRedirectTimeoutRef.current);
        finalRedirectTimeoutRef.current = null;
      }
      finalRedirectScheduledRef.current = false;
    };
  }, []);

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
      setPinMovido(true);
      setPinLocationMovida(pos);
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

  const verDetallesPaseador = () => {
    if (!paseadorInfo) return;
    navigation.navigate("verDetallesPaseadorEnMapa", { paseador: paseadorInfo });
  };

  const volverAInicio = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("Inicio_cliente");
  };

  const sendInitialPosition = () => {
    console.log("[MapaCliente ubicación] iframe cargado", {
      clientePos,
      tieneIframe: Boolean(iframeRef.current?.contentWindow),
    });
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

  const irAMiUbicacion = async () => {
    console.log("[MapaCliente ubicación] Botón presionado", {
      plataforma: Platform.OS,
      isWeb,
      tieneGeolocalizacion: Boolean(typeof navigator !== "undefined" && navigator.geolocation),
      tieneMapaNativo: Boolean(mapRef.current),
    });
    try {
      if (isWeb) {
        if (!navigator.geolocation) {
          console.warn("[MapaCliente ubicación] navigator.geolocation no disponible");
          Alert.alert("Error", "Geolocalización no disponible en tu navegador.");
          return;
        }

        console.log("[MapaCliente ubicación] Solicitando GPS web", {
          secureContext: window.isSecureContext,
          origin: window.location.origin,
        });
        if (navigator.permissions?.query) {
          navigator.permissions.query({ name: "geolocation" })
            .then((permission) => console.log("[MapaCliente ubicación] Permiso GPS web", permission.state))
            .catch((error) => console.warn("[MapaCliente ubicación] No se pudo consultar permiso GPS", error));
        }

        let gpsRespondio = false;
        const gpsWatchdog = setTimeout(() => {
          if (!gpsRespondio) {
            console.error("[MapaCliente ubicación] GPS web no respondió en 12 segundos");
            Alert.alert(
              "Ubicación no disponible",
              "El navegador no respondió. Verifica el permiso de ubicación para este sitio e inténtalo nuevamente."
            );
          }
        }, 32000);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            gpsRespondio = true;
            clearTimeout(gpsWatchdog);
            const { latitude, longitude } = position.coords;
            console.log("[MapaCliente ubicación] GPS web recibido", {
              latitude,
              longitude,
              accuracy: position.coords.accuracy,
            });
            const nuevoPos = { latitude, longitude };
            const direccionTemporal = {
              direccion_id: `temp_${Date.now()}`,
              latitud: latitude,
              longitud: longitude,
              calle: "Ubicación actual",
              numero_calle: "",
              colonia: "Seleccionada en el mapa",
            };
            direccionSeleccionadaIdRef.current = null;
            direccionSeleccionadaActivaRef.current = false;
            setDireccionSeleccionadaId(null);
            setDireccionSeleccionada(direccionTemporal);
            storage.setItem(DIRECCION_SELECCIONADA_KEY, JSON.stringify(direccionTemporal));
            setGpsPos(nuevoPos);
            setClientePos(nuevoPos);
            setAddress(null);
            setDisplayCoords(`Lat: ${latitude.toFixed(6)}\nLng: ${longitude.toFixed(6)}`);
            setPinMovido(true);
            setPinLocationMovida(nuevoPos);
            iframeRef.current?.contentWindow?.postMessage(
              { type: "updateCliente", lat: latitude, lng: longitude },
              "*"
            );
            console.log("[MapaCliente ubicación] Estado y mapa web actualizados", {
              nuevoPos,
              tieneIframe: Boolean(iframeRef.current?.contentWindow),
            });
          },
          (error) => {
            gpsRespondio = true;
            clearTimeout(gpsWatchdog);
            console.error("[MapaCliente ubicación] Error GPS web", {
              code: error?.code,
              message: error?.message,
            });
            Alert.alert("Error", "No se pudo obtener tu ubicación actual. Verifica los permisos.");
          },
          { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
        );
        return;
      }

      const { Location } = require("expo-location");
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("[MapaCliente ubicación] Permiso nativo", { status });
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Se necesita acceso a tu ubicación.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      console.log("[MapaCliente ubicación] GPS nativo recibido", location?.coords);
      const { latitude, longitude } = location.coords;
      const nuevoPos = { latitude, longitude };
      const direccionTemporal = {
        direccion_id: `temp_${Date.now()}`,
        latitud: latitude,
        longitud: longitude,
        calle: "Ubicación actual",
        numero_calle: "",
        colonia: "Seleccionada en el mapa",
      };
      direccionSeleccionadaIdRef.current = null;
      direccionSeleccionadaActivaRef.current = false;
      setDireccionSeleccionadaId(null);
      setDireccionSeleccionada(direccionTemporal);
      storage.setItem(DIRECCION_SELECCIONADA_KEY, JSON.stringify(direccionTemporal));
      setGpsPos(nuevoPos);
      setClientePos(nuevoPos);
      setAddress(null);
      setDisplayCoords(`Lat: ${latitude.toFixed(6)}\nLng: ${longitude.toFixed(6)}`);
      setPinMovido(true);
      setPinLocationMovida(nuevoPos);
      mapRef.current?.animateToRegion?.({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
      console.log("[MapaCliente ubicación] Estado y mapa nativo actualizados", {
        nuevoPos,
        tieneAnimateToRegion: Boolean(mapRef.current?.animateToRegion),
      });
    } catch (error) {
      console.error("[MapaCliente ubicación] Error obteniendo ubicación", error);
      Alert.alert("Error", "No se pudo obtener tu ubicación actual.");
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
          scrollEnabled={!isMapInteracting}
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

            {pinMovido ? (
              <TouchableOpacity
                style={styles.usarUbicacionBtn}
                onPress={usarUbicacionMovida}
              >
                <Text style={styles.usarUbicacionBtnText}>✓ Usar esta ubicación</Text>
              </TouchableOpacity>
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
          <View
            style={[styles.mapContainer, expanded && styles.mapContainerExpanded]}
            onTouchStart={() => setIsMapInteracting(true)}
            onTouchMove={() => setIsMapInteracting(true)}
            onTouchEnd={() => setIsMapInteracting(false)}
            onTouchCancel={() => setIsMapInteracting(false)}
          >
            {MapView && Marker && Polyline && !isWeb ? (
              <MapView
                ref={mapRef}
                style={styles.mapWebView}
                provider={PROVIDER_GOOGLE || undefined}
                initialRegion={region}
                showsUserLocation
                showsMyLocationButton
                loadingEnabled
                customMapStyle={UBER_MAP_STYLE}
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
                sandbox="allow-scripts allow-same-origin"
                onLoad={sendInitialPosition}
                style={{ width: "100%", height: "100%", border: "none", pointerEvents: "auto" }}
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

            <TouchableOpacity
              style={styles.localizarBtn}
              onPress={irAMiUbicacion}
            >
              <Text style={styles.localizarBtnText}>📍</Text>
            </TouchableOpacity>

            {!expanded && (
              <Text style={styles.instructions}>
                {paseadorPos ? "🐕 Viendo al paseador" : "Arrastra el pin 📍"}
              </Text>
            )}
          </View>

          {paseadorInfo ? (
            <TouchableOpacity style={styles.paseadorCard} onPress={verDetallesPaseador} activeOpacity={0.9}>
              <Image
                source={
                  paseadorInfo.url_foto_perfil
                    ? { uri: `${API_URL}/uploads/${paseadorInfo.url_foto_perfil}` }
                    : require("../../../assets/perfil.png")
                }
                style={styles.paseadorFoto}
              />
              <View style={styles.paseadorInfo}>
                <Text style={styles.paseadorNombre} numberOfLines={1}>
                  {`${paseadorInfo.nombre}${paseadorInfo.apellido ? ` ${paseadorInfo.apellido}` : ""}`}
                </Text>
                <Text style={styles.paseadorCalificacion}>
                  Calificación: {calificacionPromedio === null ? "..." : `${calificacionPromedio.toFixed(1)} / 5`}
                </Text>
              </View>
              <Text style={styles.paseadorArrow}>›</Text>
            </TouchableOpacity>
          ) : null}

          {prorrogaEntregaExpiraEn ? (
            <View style={{ backgroundColor: "#FFF3CD", borderRadius: 12, padding: 12, marginTop: 10 }}>
              <Text style={{ color: "#664D03", fontWeight: "700" }}>
                Te damos más tiempo para la entrega de las mascotas.
              </Text>
              <Text style={{ color: "#B42318", fontSize: 18, fontWeight: "800", marginTop: 4 }}>
                {`${Math.floor(Math.max(0, prorrogaEntregaExpiraEn - prorrogaAhora) / 60000)}:${String(Math.floor((Math.max(0, prorrogaEntregaExpiraEn - prorrogaAhora) % 60000) / 1000)).padStart(2, "0")}`}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.addButton} onPress={handleAddStartLocation}>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
          <Text style={styles.addButtonLabel}>Agregar direccion</Text>
        </ScrollView>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={showPaseadorCancelado}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPaseadorCancelado(false);
          navigation.reset({ index: 0, routes: [{ name: "Inicio_cliente" }] });
        }}
      >
        <View style={styles.canceladoModalOverlay}>
          <View style={styles.canceladoModalCard}>
            <Text style={styles.canceladoModalText}>{mensajeCancelacion}</Text>
            <TouchableOpacity
              style={styles.canceladoModalButton}
              onPress={() => {
                setShowPaseadorCancelado(false);
                navigation.reset({ index: 0, routes: [{ name: "Inicio_cliente" }] });
              }}
            >
              <Text style={styles.canceladoModalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEntregaModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          entregaInicialPendienteRef.current = false;
          setShowEntregaModal(false);
          setRespuestaEntregaExpiraEn(null);
                    if (faseEntrega === "final") {
                      socket.emit("cliente:entrega:confirmar", { servicioId, respuesta: false });
                    } else {
            socket.emit("cliente:mascotas:no-entregadas", { servicioId });
          }
        }}
      >
        <View style={styles.canceladoModalOverlay}>
          <View style={styles.canceladoModalCard}>
            <Text style={styles.canceladoModalText}>
              {faseEntrega === "final"
                ? "Las mascotas llegaron sanos y salvos?"
                : pasoEntregaInicial === "llegada"
                  ? "El paseador ya está afuera esperándote. ¿Vas a entregar las mascotas?"
                  : "¿Entregaste las mascotas al paseador?"}
                {faseEntrega === "recogida" && pasoEntregaInicial === "llegada" && respuestaEntregaExpiraEn
                  ? `  ${Math.max(0, Math.ceil((respuestaEntregaExpiraEn - respuestaEntregaAhora) / 1000))}s`
                  : ""}
                {faseEntrega === "recogida" && esperaEntregaExpiraEn
                  ? `  (${Math.floor(Math.max(0, esperaEntregaExpiraEn - esperaEntregaAhora) / 60000)}:${String(Math.floor((Math.max(0, esperaEntregaExpiraEn - esperaEntregaAhora) % 60000) / 1000)).padStart(2, "0")})`
                  : ""}
            </Text>
            <View style={styles.entregaModalActions}>
              <TouchableOpacity
                style={styles.entregaModalNoButton}
                onPress={() => {
                  entregaInicialPendienteRef.current = false;
                  setShowEntregaModal(false);
                    setRespuestaEntregaExpiraEn(null);
                  if (faseEntrega === "final") {
                    socket.emit("cliente:entrega:confirmar", { servicioId, respuesta: false });
                  } else {
                      socket.emit("cliente:mascotas:no-entregadas", { servicioId });
                    }
                }}
              >
                  <Text style={styles.canceladoModalButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.canceladoModalButton}
                onPress={() => {
                  entregaInicialPendienteRef.current = false;
                  setShowEntregaModal(false);
                  if (faseEntrega === "final") {
                    socket.emit("cliente:entrega:confirmar", { servicioId, respuesta: true });
                  } else if (pasoEntregaInicial === "llegada") {
                    setPasoEntregaInicial("entrega");
                    setRespuestaEntregaExpiraEn(null);
                    entregaInicialPendienteRef.current = true;
                    setShowEntregaModal(true);
                  } else {
                    entregaInicialPendienteRef.current = false;
                    setRespuestaEntregaExpiraEn(null);
                    setEsperaEntregaExpiraEn(null);
                    storage.removeItem(ESPERA_ENTREGA_KEY);
                    socket.emit("cliente:mascotas:entregadas", { servicioId });
                  }
                }}
              >
                  <Text style={styles.canceladoModalButtonText}>Sí</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BARRA INFERIOR CLIENTE */}
      <View style={styles.bottomTab}>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(0)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(0)}
          onPressOut={() => setHoveredTab(null)}
          onPress={volverAInicio}
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
