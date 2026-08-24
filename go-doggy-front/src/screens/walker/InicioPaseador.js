import React, { useEffect, useState, useRef, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Modal, ScrollView } from "react-native";
import { s, vs, ms } from "../../utils/responsive";
import { getSocket } from "../../utils/socket";
import { apiFetch } from "../../utils/api";
import storage from "../../utils/storage";
import LiveMap from "../../components/LiveMap";
import { requestLocationPermission, getCurrentPosition, watchPosition } from "../../utils/geo";

const DEFAULT_LAT = 20.907715;
const DEFAULT_LNG = -100.707582;
const SHOW_CRONOMETRO_CARD = true;

export default function InicioPaseador({ route, navigation }) {
  const [usuario, setUsuario]               = useState(null);
  const [miPos, setMiPos]                   = useState(null);
  const [calleActual, setCalleActual]       = useState(null);
  const [servicioActivo, setServicioActivo] = useState(null);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [ruta, setRuta]                     = useState([]);
  const [destinoPos, setDestinoPos]         = useState(null);
  const [conectado, setConectado]           = useState(false);
  const [locationButtonHovered, setLocationButtonHovered] = useState(false);
  const [mapCommand, setMapCommand] = useState(null);
  const [esperandoConfirmacion, setEsperandoConfirmacion] = useState(false);
  const [pendienteConfirmacionId, setPendienteConfirmacionId] = useState(null);
  const [cronometroSegundos, setCronometroSegundos] = useState(0);
  const [finalizandoServicio, setFinalizandoServicio] = useState(false);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [showCancelarModal, setShowCancelarModal] = useState(false);
  const [showRecogidaModal, setShowRecogidaModal] = useState(false);
  const [recogidaEsRecordatorio, setRecogidaEsRecordatorio] = useState(false);
  const [recogidaServicioId, setRecogidaServicioId] = useState(null);
  const [showEntregaFinalModal, setShowEntregaFinalModal] = useState(false);
  const [mapVersion, setMapVersion] = useState(0);
  const [prorrogaEntregaExpiraEn, setProrrogaEntregaExpiraEn] = useState(null);
  const [prorrogaAhora, setProrrogaAhora] = useState(Date.now());
  const [mensajeAlertaEntrega, setMensajeAlertaEntrega] = useState("");
  const [resumenFinalizacion, setResumenFinalizacion] = useState(route?.params?.resumenFinalizacion || null);
  const [llegadaExpiraEn, setLlegadaExpiraEn] = useState(null);
  const [llegadaClock, setLlegadaClock] = useState(Date.now());
  const [esperandoEntregaFinal, setEsperandoEntregaFinal] = useState(false);
  const [mascotasListasServicioId, setMascotasListasServicioId] = useState(null);

  const conectadoRef = useRef(conectado);
  const pendienteConfirmacionIdRef = useRef(pendienteConfirmacionId);
  const watchRef          = useRef(null);
  const servicioActivoRef = useRef(null);
  const iframeRef         = useRef(null);
  const rutaRef           = useRef([]);
  const miPosRef          = useRef(null);
  const inicioServicioRef = useRef(null);
  const avisosCincoMinutosRef = useRef(new Set());
  const entregaFinalSolicitadaRef = useRef(new Set());
  const ultimaGeocodificacionRef = useRef(0);
  const isWeb             = Platform.OS === "web";
  const socket            = getSocket();

  useEffect(() => {
    if (!prorrogaEntregaExpiraEn) return;
    const intervalId = setInterval(() => setProrrogaAhora(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [prorrogaEntregaExpiraEn]);

  useEffect(() => {
    if (!mensajeAlertaEntrega) return;
    const timeoutId = setTimeout(() => {
      setMensajeAlertaEntrega("");
      navigation.reset({ index: 0, routes: [{ name: "InicioPaseador" }] });
    }, 10000);
    return () => clearTimeout(timeoutId);
  }, [mensajeAlertaEntrega, navigation]);

  useEffect(() => {
    if (!miPos) return;

    const ahora = Date.now();
    if (ahora - ultimaGeocodificacionRef.current < 10000) return;
    ultimaGeocodificacionRef.current = ahora;
    let activo = true;

    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${miPos[0]}&lon=${miPos[1]}&zoom=18&addressdetails=1&accept-language=es`,
      { headers: { Accept: "application/json" } }
    )
      .then((response) => response.json())
      .then((data) => {
        if (!activo) return;
        const address = data?.address || {};
        const calle = address.road || address.street || address.residential || address.pedestrian;
        const numero = address.house_number ? ` #${address.house_number}` : "";
        setCalleActual(calle ? `${calle}${numero}` : null);
      })
      .catch(() => {
        if (activo) setCalleActual(null);
      });

    return () => { activo = false; };
  }, [miPos]);

  const getPaseadorId = (paseador) => Number(paseador?.paseador_id || paseador?.usuario_id || paseador?.id || 0);

  const parseDestino = (destino) => {
    const lat = Number(destino?.lat || destino?.direccion_latitud || destino?.latitud);
    const lng = Number(destino?.lng || destino?.direccion_longitud || destino?.longitud);
    return Number.isFinite(lat) && Number.isFinite(lng)
      ? { latitude: lat, longitude: lng }
      : null;
  };

  const sincronizarDetalleServicio = async (servicioBase) => {
    const servicioId = Number(servicioBase?.servicio_id || 0);
    if (!servicioId) return;

    try {
      const detalle = await apiFetch(`/servicio/${servicioId}`);
      const detalleId = Number(detalle?.servicio_id || 0);
      if (!detalleId) return;

      setServicioActivo((actual) => {
        if (Number(actual?.servicio_id || 0) !== detalleId) return actual;
        return { ...actual, ...detalle };
      });

      if (!destinoPos) {
        const destinoDetalle = parseDestino(detalle);
        if (destinoDetalle) {
          setDestinoPos(destinoDetalle);
        }
      }
    } catch (error) {
      console.warn("No se pudo sincronizar detalle del servicio activo:", error?.message || error);
    }
  };

  const getDireccionCliente = (servicio) => {
    if (!servicio || typeof servicio !== "object") return "Direccion no disponible";

    const calle = String(
      servicio?.direccion_calle ||
      servicio?.calle ||
      servicio?.destino_calle ||
      servicio?.calle_destino ||
      ""
    ).trim();

    const numero = String(
      servicio?.direccion_numero_calle ||
      servicio?.direccion_numero ||
      servicio?.numero_calle ||
      servicio?.numero_externo ||
      servicio?.numero ||
      servicio?.destino_numero ||
      ""
    ).trim();

    if (calle && numero) return `${calle} #${numero}`;
    if (calle) return calle;
    if (numero) return `#${numero}`;
    return "Direccion no disponible";
  };

  const activarServicio = (servicio, destino) => {
    if (!servicio) return;

    const nextId = Number(servicio.servicio_id);
    const currentId = Number(servicioActivoRef.current?.servicio_id);
    if (nextId && currentId && nextId === currentId) return;

    setEsperandoConfirmacion(false);
    setPendienteConfirmacionId(null);
    setShowRecogidaModal(false);
    setRecogidaServicioId(null);
    setMascotasListasServicioId(null);
    setServicioActivo(servicio);
    servicioActivoRef.current = servicio;
    setCronometroSegundos(0);
    setLlegadaExpiraEn(null);
    setDestinoPos(destino || parseDestino(servicio));

    // Hidrata con el detalle oficial para asegurar calle + numero correctos.
    sincronizarDetalleServicio(servicio);
  };

  const cargarServicioActivoPaseador = async (paseadorId) => {
    if (!paseadorId) return;

    try {
      const servicios = await apiFetch(`/servicios/paseador/${paseadorId}`);
      const activo = Array.isArray(servicios)
        ? servicios.find((item) => ["en_camino", "activo"].includes(String(item?.estado || "").toLowerCase()))
        : null;

      if (activo) {
        if (esServicioVencido(activo)) {
          try {
            await apiFetch(`/servicio/${activo.servicio_id}/finalizar`, { method: "PUT" });
          } catch (error) {
            console.warn("No se pudo cerrar automáticamente un servicio vencido:", error?.message || error);
          }
          limpiarServicioActivo();
          return;
        }

        activarServicio(activo, parseDestino(activo));
      }
    } catch (error) {
      console.warn("No se pudo restaurar servicio activo del paseador:", error?.message || error);
    }
  };

  const formatTime = (seconds) => {
    const total = Math.max(0, Number(seconds) || 0);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const tiempoRestanteSegundos = servicioActivo
    ? Math.max(0, (Number(servicioActivo.duracion_minutos) || 0) * 60 - cronometroSegundos)
    : 0;

  const tiempoLlegadaRestante = llegadaExpiraEn
    ? Math.max(0, Math.ceil((llegadaExpiraEn - llegadaClock) / 1000))
    : 0;

  const esServicioVencido = (servicio) => {
    if (!servicio) return false;

    const estado = String(servicio?.estado || "").toLowerCase();
    if (!["en_camino", "activo"].includes(estado)) return false;

    const inicioTs = servicio?.hora_inicio ? new Date(servicio.hora_inicio).getTime() : NaN;
    if (!Number.isFinite(inicioTs)) return false;

    const elapsedMinutes = (Date.now() - inicioTs) / 60000;
    const duracion = Math.max(0, Number(servicio?.duracion_minutos) || 0);
    const tolerancia = 15;
    const maxSinDuracion = 180;

    if (duracion > 0) {
      return elapsedMinutes > duracion + tolerancia;
    }

    return elapsedMinutes > maxSinDuracion;
  };

  useEffect(() => { conectadoRef.current = conectado; }, [conectado]);
  useEffect(() => { pendienteConfirmacionIdRef.current = pendienteConfirmacionId; }, [pendienteConfirmacionId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const summary = route?.params?.resumenFinalizacion;
      if (summary && typeof summary === 'object') {
        setResumenFinalizacion(summary);
      }
    });

    return unsubscribe;
  }, [navigation, route?.params?.resumenFinalizacion]);

  const toggleConectado = () => {
    const paseadorId = getPaseadorId(usuario);
    if (!paseadorId) {
      Alert.alert("Error", "No se pudo cambiar el estado. Vuelve a iniciar sesión.");
      return;
    }
    const nuevoEstado = !conectado;
    conectadoRef.current = nuevoEstado;
    setConectado(nuevoEstado);
    if (nuevoEstado) {
      socket.emit("paseador:online", { paseadorId });
    } else {
      socket.emit("paseador:offline", { paseadorId });
    }
  };

  const limpiarServicioActivo = () => {
    detenerGPS();
    servicioActivoRef.current = null;
    inicioServicioRef.current = null;
    setServicioActivo(null);
    setDestinoPos(null);
    setLlegadaExpiraEn(null);
    setCronometroSegundos(0);
    rutaRef.current = [];
    setRuta([]);
  };

  const cerrarResumenFinalizacion = () => {
    setResumenFinalizacion(null);
    rutaRef.current = [];
    setRuta([]);
    setDestinoPos(null);
    setMapVersion((version) => version + 1);
    iniciarGPS();
  };

  const normalizarSolicitud = (solicitud) => {
    if (!solicitud) return null;

    const mascotas = Array.isArray(solicitud.mascotas)
      ? solicitud.mascotas
          .filter((item) => item && item.mascota_id)
          .map((item) => ({
            mascota_id: Number(item.mascota_id),
            mascota_nombre: item.mascota_nombre || `#${item.mascota_id}`,
          }))
      : [];

    return {
      ...solicitud,
      servicio_id: Number(solicitud.servicio_id),
      mascotas,
    };
  };

  const cargarSolicitudesPendientes = async (position = miPos) => {
    try {
      const query = Array.isArray(position) && position.length >= 2
        ? `?lat=${encodeURIComponent(position[0])}&lng=${encodeURIComponent(position[1])}`
        : "";
      const data = await apiFetch(`/servicios/pendientes${query}`);
      const nuevasSolicitudes = Array.isArray(data)
        ? data.map(normalizarSolicitud).filter(Boolean)
        : [];

      setSolicitudesPendientes(nuevasSolicitudes);
      console.log("[Solicitudes] Sincronización REST", {
        visibles: nuevasSolicitudes.map((solicitud) => solicitud.servicio_id),
      });
    } catch (error) {
      console.error("❌ Error cargando solicitudes pendientes:", error);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!miPosRef.current || servicioActivoRef.current) return;
      cargarSolicitudesPendientes(miPosRef.current);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const servicio = servicioActivoRef.current;
      const posicion = miPosRef.current;
      if (!servicio || String(servicio.estado || "").toLowerCase() !== "en_camino" || !posicion) return;
      socket.emit("paseador:location", {
        servicioId: servicio.servicio_id,
        lat: posicion[0],
        lng: posicion[1],
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, [socket]);

  useEffect(() => {
    const publicarPresencia = () => {
      const paseadorId = getPaseadorId(usuario);
      const posicion = miPosRef.current;
      if (!paseadorId || !posicion || servicioActivoRef.current) return;

      socket.emit("paseador:disponible:ubicacion", {
        paseadorId,
        lat: posicion[0],
        lng: posicion[1],
      });
    };

    socket.on("connect", publicarPresencia);
    publicarPresencia();
    return () => socket.off("connect", publicarPresencia);
  }, [socket, usuario]);

  // ─── HTML del mapa web — mismo que MapaCliente ──────────────────────────────
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
    const map = L.map('map', {
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true
    }).setView([${DEFAULT_LAT},${DEFAULT_LNG}], 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{
      maxZoom:20,
      subdomains:'abcd',
      attribution:'&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    // Marcador del paseador (badge moderno)
    const paseadorIcon = L.divIcon({
      className:'',
      iconSize:[32,32],
      iconAnchor:[16,32],
      html:'<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(145deg,#34d399,#059669);border:3px solid #ffffff;box-shadow:0 8px 18px rgba(5,150,105,.35);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">P</div>'
    });
    const paseadorMarker = L.marker([${DEFAULT_LAT},${DEFAULT_LNG}],
      {icon:paseadorIcon}).addTo(map).bindPopup('📍 Tu ubicación');

    let routeLine = null;
    let destinoMarker = null;
    let destinoLine = null;
    let userMoved = false;
    map.on('dragstart zoomstart', () => { userMoved = true; });

    window.addEventListener('message', function(ev) {
      if (!ev.data) return;
      const d = ev.data;

      if (d.type === 'updatePaseador') {
        paseadorMarker.setLatLng([d.lat, d.lng]);
        if (!userMoved) map.setView([d.lat, d.lng], map.getZoom(), {animate:true});

        if (routeLine) {
          map.removeLayer(routeLine);
          routeLine = null;
        }
        if (d.route && d.route.length > 1) {
          routeLine = L.polyline(d.route, {
            color:'#047857',
            weight:5,
            opacity:0.9,
            lineJoin:'round',
            dashArray:'10, 8'
          }).addTo(map);
        }

        if (d.destino && Number.isFinite(d.destino.lat) && Number.isFinite(d.destino.lng)) {
          if (!destinoMarker) {
            destinoMarker = L.marker([d.destino.lat, d.destino.lng]).addTo(map).bindPopup('📍 Cliente');
          } else {
            destinoMarker.setLatLng([d.destino.lat, d.destino.lng]);
          }

          if (destinoLine) {
            map.removeLayer(destinoLine);
            destinoLine = null;
          }
          destinoLine = L.polyline([ [d.lat, d.lng], [d.destino.lat, d.destino.lng] ], {
            color:'#dc2626',
            weight:4,
            opacity:0.85,
            dashArray:'8, 6'
          }).addTo(map);
        } else {
          if (destinoMarker) {
            map.removeLayer(destinoMarker);
            destinoMarker = null;
          }
          if (destinoLine) {
            map.removeLayer(destinoLine);
            destinoLine = null;
          }
        }
      }

      if (d.type === 'centerPaseador') {
        userMoved = false;
        map.setView([d.lat, d.lng], map.getZoom(), {animate:true});
      }

      if (d.type === 'zoomIn') map.setZoom(map.getZoom() + 1);
      if (d.type === 'zoomOut') map.setZoom(map.getZoom() - 1);
    });
  </script>
</body>
</html>`, []);

  // ─── Inicialización ─────────────────────────────────────────────────────────
  useEffect(() => {
    const activeRole = storage.getItem("active_role");
    const u = activeRole === "paseador"
      ? JSON.parse(storage.getItem("paseador") || "{}")
      : {};
    const paseadorId = getPaseadorId(u);
    setUsuario(u);
    if (paseadorId) {
      socket.emit("paseador:online", { paseadorId });
      setConectado(true);
      cargarServicioActivoPaseador(paseadorId);
    }
    iniciarGPS();
    socket.on("servicio:nuevo", (data) => {
      if (!conectadoRef.current) return;
      const solicitud = normalizarSolicitud(data);
      if (!solicitud) return;

      setSolicitudesPendientes((current) => {
        const existe = current.some(
          (item) => Number(item.servicio_id) === Number(solicitud.servicio_id)
        );
        if (existe) return current;
        console.log("[Solicitudes] Agregada por Socket.IO", {
          servicioId: solicitud.servicio_id,
          expiraEn: solicitud.expiraEn,
        });
        return [solicitud, ...current];
      });
    });

    socket.on("servicio:retirado", (payload) => {
      const servicioId = Number(payload?.servicio_id || 0);
      if (!servicioId) return;
      console.warn("[Solicitudes] Retirada por Socket.IO", { servicioId });
      setSolicitudesPendientes((current) =>
        current.filter((item) => Number(item.servicio_id) !== servicioId)
      );
    });

    socket.on("paseador:servicio:confirmado", (payload) => {
      const servicio = payload?.servicio;
      if (!servicio) return;
      const servicioId = Number(servicio.servicio_id);
      if (!servicioId) return;

      const currentPaseadorId = getPaseadorId(u);
      const payloadPaseadorId = getPaseadorId(servicio);
      if (currentPaseadorId && payloadPaseadorId && currentPaseadorId !== payloadPaseadorId) return;

      const pendingId = Number(pendienteConfirmacionIdRef.current || 0);
      const estado = String(servicio?.estado || "").toLowerCase();
      const isStarted = estado === "en_camino" || estado === "activo";
      if (pendingId && servicioId !== pendingId && !isStarted) return;

      activarServicio(servicio, parseDestino(payload?.destino));
      Alert.alert("¡Cliente aceptó!", "Dirígete al domicilio del cliente. El cronómetro iniciará cuando se confirme la entrega de las mascotas.");
      if (navigation?.navigate) {
        navigation.navigate("InicioPaseador");
      }
    });

    socket.on("paseador:recogida:confirmar", (payload) => {
      const servicioId = Number(payload?.servicio_id || 0);
      if (!servicioId || servicioId !== Number(servicioActivoRef.current?.servicio_id || 0)) return;
      setRecogidaServicioId(servicioId);
      setRecogidaEsRecordatorio(false);
      setShowRecogidaModal(true);
    });

    const mostrarRecordatorioRecogida = (payload) => {
      const servicioId = Number(payload?.servicio_id || 0);
      if (!servicioId || servicioId !== Number(servicioActivoRef.current?.servicio_id || 0)) return;
      setRecogidaServicioId(servicioId);
      setRecogidaEsRecordatorio(true);
      const segundosRestantes = Number(payload?.segundos_restantes);
      if (Number.isFinite(segundosRestantes)) {
        setLlegadaExpiraEn(Date.now() + segundosRestantes * 1000);
      }
      setShowRecogidaModal(true);
    };

    socket.on("paseador:recogida:rechazada", mostrarRecordatorioRecogida);
    socket.on("paseador:recogida:recordatorio", mostrarRecordatorioRecogida);

    socket.on("paseador:tarifa:rechazada", (payload) => {
      const servicioId = Number(payload?.servicio_id);
      if (!servicioId || servicioId !== pendienteConfirmacionIdRef.current) return;
      setEsperandoConfirmacion(false);
      setPendienteConfirmacionId(null);
      Alert.alert("Tarifa rechazada", "El cliente rechazó la tarifa. La solicitud vuelve a estar disponible.");
      cargarSolicitudesPendientes();
    });

    socket.on("paseador:entrega:confirmada", (payload) => {
      const servicioId = Number(payload?.servicio_id || 0);
      if (!servicioId || servicioId !== Number(servicioActivoRef.current?.servicio_id || 0)) return;

      setEsperandoEntregaFinal(false);
      Alert.alert("Paseo concluido", "El paseo ha concluido, gracias por su preferencia.");
      finalizarServicioAsync(servicioId);
    });

    socket.on("paseador:entrega:rechazada", (payload) => {
      const servicioId = Number(payload?.servicio_id || 0);
      if (!servicioId || servicioId !== Number(servicioActivoRef.current?.servicio_id || 0)) return;
      setEsperandoEntregaFinal(false);
      Alert.alert("Entrega no confirmada", "El cliente indicó que todavía no recibió las mascotas.");
    });

    socket.on("paseador:entrega:prorroga", (payload) => {
      const servicioId = Number(payload?.servicio_id || 0);
      if (!servicioId || servicioId !== Number(servicioActivoRef.current?.servicio_id || 0)) return;
      setProrrogaEntregaExpiraEn(Date.now() + Number(payload?.segundos_restantes || 120) * 1000);
    });

    socket.on("paseador:entrega:alerta", (payload) => {
      const servicioId = Number(payload?.servicio_id || 0);
      if (!servicioId || servicioId !== Number(servicioActivoRef.current?.servicio_id || 0)) return;
      setProrrogaEntregaExpiraEn(null);
      limpiarServicioActivo();
      setMensajeAlertaEntrega(payload?.mensaje_paseador || "Tienes 1 hora para entregar a las mascotas pendientes.");
    });

    socket.on("paseador:entrega:recordatorio", (payload) => {
      const servicioId = Number(payload?.servicio_id || 0);
      if (!servicioId || servicioId !== Number(servicioActivoRef.current?.servicio_id || 0)) return;
      setShowEntregaFinalModal(true);
    });

    socket.on("paseador:mascotas:entregadas", (payload) => {
      const servicioId = Number(payload?.servicio_id || 0);
      if (!servicioId || servicioId !== Number(servicioActivoRef.current?.servicio_id || 0)) return;
      setMascotasListasServicioId(null);
      apiFetch(`/servicio/${servicioId}`)
        .then((detalle) => {
          setServicioActivo((actual) => {
            if (Number(actual?.servicio_id || 0) !== servicioId) return actual;
            return { ...actual, ...detalle, estado: "activo" };
          });
        })
        .catch((error) => console.warn("No se pudo iniciar el cronómetro del paseo:", error?.message || error));
      Alert.alert("Mascotas entregadas", "El cliente confirmó la entrega de las mascotas.");
    });

    socket.on("servicio:cancelado", (payload) => {
      const servicioId = Number(payload?.servicio_id || 0);
      if (!servicioId || servicioId !== Number(servicioActivoRef.current?.servicio_id || 0)) return;
      setMascotasListasServicioId(null);
      limpiarServicioActivo();
      Alert.alert(
        "Servicio cancelado",
        payload?.mensaje_paseador || "El cliente no entregó a las mascotas a tiempo."
      );
      navigation.reset({ index: 0, routes: [{ name: "InicioPaseador" }] });
    });

    return () => {
      socket.off("servicio:nuevo");
      socket.off("servicio:retirado");
      socket.off("paseador:servicio:confirmado");
      socket.off("paseador:recogida:confirmar");
      socket.off("paseador:recogida:rechazada", mostrarRecordatorioRecogida);
      socket.off("paseador:recogida:recordatorio", mostrarRecordatorioRecogida);
      socket.off("paseador:tarifa:rechazada");
      socket.off("paseador:entrega:confirmada");
      socket.off("paseador:entrega:rechazada");
      socket.off("paseador:entrega:prorroga");
      socket.off("paseador:entrega:alerta");
      socket.off("paseador:entrega:recordatorio");
      socket.off("paseador:mascotas:entregadas");
      socket.off("servicio:cancelado");
      detenerGPS();
    };
  }, []);

  useEffect(() => {
    if (!esperandoConfirmacion || !pendienteConfirmacionId) return;

    let cancelled = false;

    const syncEstadoServicio = async () => {
      const paseadorId = getPaseadorId(usuario);
      if (!paseadorId) return;

      try {
        const servicios = await apiFetch(`/servicios/paseador/${paseadorId}`);
        if (!Array.isArray(servicios)) return;

        const confirmado = servicios.find((item) =>
          Number(item?.servicio_id) === Number(pendienteConfirmacionId) &&
          ["en_camino", "activo"].includes(String(item?.estado || "").toLowerCase())
        );

        if (!cancelled && confirmado) {
          activarServicio(confirmado, parseDestino(confirmado));
          Alert.alert("¡Cliente aceptó!", "Dirígete al domicilio del cliente. El cronómetro iniciará cuando se confirme la entrega de las mascotas.");
        }
      } catch (error) {
        console.warn("No se pudo sincronizar confirmación del paseo:", error?.message || error);
      }
    };

    syncEstadoServicio();
    const intervalId = setInterval(syncEstadoServicio, 4000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [esperandoConfirmacion, pendienteConfirmacionId, usuario]);

  useEffect(() => {
    const servicioId = Number(servicioActivo?.servicio_id || servicioActivoRef.current?.servicio_id || 0);
    if (!servicioId || String(servicioActivo?.estado || "").toLowerCase() !== "en_camino") return;

    let cancelado = false;
    const sincronizarConfirmacionCliente = async () => {
      try {
        const detalle = await apiFetch(`/servicio/${servicioId}`);
        if (cancelado || String(detalle?.estado || "").toLowerCase() !== "activo") return;

        setServicioActivo((actual) => {
          if (Number(actual?.servicio_id || 0) !== servicioId) return actual;
          const actualizado = { ...actual, ...detalle, estado: "activo" };
          servicioActivoRef.current = actualizado;
          return actualizado;
        });
      } catch (error) {
        console.warn("No se pudo sincronizar la entrega confirmada por el cliente:", error?.message || error);
      }
    };

    sincronizarConfirmacionCliente();
    const intervalId = setInterval(sincronizarConfirmacionCliente, 2000);
    return () => {
      cancelado = true;
      clearInterval(intervalId);
    };
  }, [servicioActivo?.servicio_id, servicioActivo?.estado]);

  useEffect(() => {
    const servicioId = Number(servicioActivo?.servicio_id || 0);
    const paseadorId = getPaseadorId(usuario);
    if (
      !servicioId ||
      !paseadorId ||
      String(servicioActivo?.estado || "").toLowerCase() !== "activo" ||
      tiempoRestanteSegundos > 0 ||
      entregaFinalSolicitadaRef.current.has(servicioId)
    ) return;

    entregaFinalSolicitadaRef.current.add(servicioId);
    setEsperandoEntregaFinal(true);
    socket.emit("paseador:entrega:solicitar", { servicioId, paseadorId });
  }, [servicioActivo?.servicio_id, servicioActivo?.estado, tiempoRestanteSegundos, usuario, socket]);

  // ─── GPS ────────────────────────────────────────────────────────────────────
  const iniciarGPS = async () => {
    if (watchRef.current) return;
    const ok = await requestLocationPermission();
    if (!ok) {
      Alert.alert("Permiso de ubicación", "Activa los permisos de ubicación para el seguimiento GPS.");
      return;
    }

    const actualizarPosicion = ({ lat, lng }) => {
      const coord = [lat, lng];
      miPosRef.current = coord;
      setMiPos(coord);
      rutaRef.current = [...rutaRef.current, coord];
      setRuta([...rutaRef.current]);
      iframeRef.current?.contentWindow?.postMessage({
        type: "updatePaseador",
        lat,
        lng,
        route: rutaRef.current,
        destino: destinoPos && Number.isFinite(destinoPos.latitude) && Number.isFinite(destinoPos.longitude)
          ? { lat: destinoPos.latitude, lng: destinoPos.longitude }
          : null,
      }, "*");

      const activo = servicioActivoRef.current;
      if (activo) {
        socket.emit("paseador:location", { servicioId: activo.servicio_id, lat, lng });
      } else {
        const paseadorId = getPaseadorId(usuario);
        if (paseadorId && conectadoRef.current) {
          socket.emit("paseador:disponible:ubicacion", { paseadorId, lat, lng });
        }
      }
    };

    watchRef.current = await watchPosition(
      actualizarPosicion,
      (err) => console.warn("GPS error:", err?.message)
    );

    const inicial = await getCurrentPosition();
    if (inicial) actualizarPosicion(inicial);
  };

  const detenerGPS = () => {
    if (watchRef.current) { watchRef.current.remove(); watchRef.current = null; }
  };

  const sendInitialPosition = () => {
    if (miPos && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: "updatePaseador",
        lat: miPos[0],
        lng: miPos[1],
        route: rutaRef.current,
        destino: destinoPos && Number.isFinite(destinoPos.latitude) && Number.isFinite(destinoPos.longitude)
          ? { lat: destinoPos.latitude, lng: destinoPos.longitude }
          : null,
      }, "*");
    }
  };

  const posicionarMapa = () => {
    if (!miPos) return;
    const centerCommand = {
      type: "centerPaseador",
      lat: miPos[0],
      lng: miPos[1],
      center: miPos,
      id: Date.now(),
    };
    if (isWeb) {
      iframeRef.current?.contentWindow?.postMessage(centerCommand, "*");
    }
    setMapCommand(centerCommand);
  };

  const cambiarZoomMapa = (delta) => {
    if (isWeb) {
      iframeRef.current?.contentWindow?.postMessage({
        type: delta > 0 ? "zoomIn" : "zoomOut",
      }, "*");
    }
    setMapCommand({ type: delta > 0 ? "zoomIn" : "zoomOut", id: Date.now() });
  };

  useEffect(() => {
    if (destinoPos && miPos && iframeRef.current?.contentWindow) {
      sendInitialPosition();
    }
  }, [destinoPos, miPos]);

  useEffect(() => {
    servicioActivoRef.current = servicioActivo;
    if (!servicioActivo || String(servicioActivo.estado || "").toLowerCase() !== "activo") {
      setCronometroSegundos(0);
      inicioServicioRef.current = null;
      return;
    }

    const inicioBase = servicioActivo.hora_inicio
      ? new Date(servicioActivo.hora_inicio).getTime()
      : Date.now();

    inicioServicioRef.current = Number.isFinite(inicioBase) ? inicioBase : Date.now();

    const actualizar = () => {
      const elapsed = Math.floor((Date.now() - inicioServicioRef.current) / 1000);
      setCronometroSegundos(Math.max(0, elapsed));
    };

    actualizar();
    const intervalId = setInterval(actualizar, 1000);
    return () => clearInterval(intervalId);
  }, [servicioActivo]);

  useEffect(() => {
    const servicioId = Number(servicioActivo?.servicio_id || 0);
    const duracionSegundos = (Number(servicioActivo?.duracion_minutos) || 0) * 60;

    if (
      !servicioId ||
      !duracionSegundos ||
      tiempoRestanteSegundos > 5 * 60 ||
      tiempoRestanteSegundos <= 0 ||
      avisosCincoMinutosRef.current.has(servicioId)
    ) {
      return;
    }

    avisosCincoMinutosRef.current.add(servicioId);
    Alert.alert(
      "El paseo está por terminar",
      "El paseo está por terminar, regresa pronto al lugar de destino.",
      [{ text: "Cerrar" }]
    );
  }, [servicioActivo?.servicio_id, servicioActivo?.duracion_minutos, tiempoRestanteSegundos]);

  // ─── Acciones de servicio ────────────────────────────────────────────────────
  const aceptarServicio = async (solicitudPendiente) => {
    if (!solicitudPendiente) {
      Alert.alert("Error", "No se encontró la solicitud para aceptar.");
      return;
    }

    const paseadorId = getPaseadorId(usuario);
    if (!paseadorId) {
      console.warn("No hay usuario logueado para aceptar servicio", usuario);
      Alert.alert("Error", "No se encontró un paseador activo. Vuelve a iniciar sesión.");
      return;
    }

    try {
      const servicio = await apiFetch(`/servicio/${solicitudPendiente.servicio_id}/aceptar`, {
        method: "PUT",
        body: JSON.stringify({ paseador_id: paseadorId }),
      });

      setPendienteConfirmacionId(servicio.servicio_id);
      setEsperandoConfirmacion(true);
      setSolicitudesPendientes((current) =>
        current.filter((item) => Number(item.servicio_id) !== Number(solicitudPendiente.servicio_id))
      );
      Alert.alert(
        "Tarifa enviada",
        "Esperando la confirmación del cliente. En cuanto acepte, podrás dirigirte al domicilio.",
      );
    } catch (e) {
      console.error("Error aceptando servicio:", e);
      Alert.alert("Error", e.message || "No se pudo aceptar la solicitud.");
    }
  };

  const rechazarServicio = async (solicitudPendiente, esAutomatico = false) => {
    if (!solicitudPendiente) return;
    console.log("[Cancelar/rechazar solicitud] Enviando", {
      servicioId: solicitudPendiente.servicio_id,
      paseadorId: getPaseadorId(usuario),
      esAutomatico,
    });
    try {
      const respuesta = await apiFetch(`/servicio/${solicitudPendiente.servicio_id}/rechazar`, {
        method: "PUT",
        body: JSON.stringify({ paseador_id: getPaseadorId(usuario) }),
      });
      console.log("[Cancelar/rechazar solicitud] Respuesta", respuesta);
      setSolicitudesPendientes((current) =>
        current.filter((item) => Number(item.servicio_id) !== Number(solicitudPendiente.servicio_id))
      );
    } catch (e) {
      console.error("[Cancelar/rechazar solicitud] Error", e);
      if (!esAutomatico) {
        Alert.alert("Error", e.message);
      }
    }
  };

  const fetchServicioDetalle = async (servicioId) => {
    try {
      return await apiFetch(`/servicio/${servicioId}`);
    } catch (error) {
      return null;
    }
  };

  const finalizarServicioAsync = async (servicioId) => {
    if (!servicioId) {
      Alert.alert("No hay servicio activo", "No se pudo finalizar porque no se detectó un servicio activo.");
      return;
    }

    const servicio = servicioActivo || servicioActivoRef.current || {};
    try {
      setFinalizandoServicio(true);
      const response = await apiFetch(`/servicio/${servicioId}/finalizar`, { method: "PUT" });

      const shouldFetchDetail = !response?.mascota_nombre || !response?.tarifa_base_hora || response?.costo_total === 0;
      const detalle = shouldFetchDetail ? await fetchServicioDetalle(servicioId) : null;
      const fuente = { ...servicio, ...detalle, ...response };

      const mascota = fuente.mascota_nombre || servicio.mascota_nombre || servicio.mascota_id || "Mascota";
      const tarifaBase = Number(
        usuario?.tarifa_base_hora ||
        fuente.tarifa_base_hora ||
        servicio.tarifa_base_hora ||
        servicio.tarifa ||
        servicio.tarifa_hora ||
        0
      );
      const duracion = Math.ceil(Math.max(cronometroSegundos, 0) / 60) || Number(fuente.duracion_minutos || servicio.duracion_minutos) || 0;
      const rawTotal = Number(fuente.costo_total || servicio.costo_total) || 0;
      const totalCobro = rawTotal > 0
        ? rawTotal
        : tarifaBase > 0 && duracion > 0
        ? Number(((tarifaBase * duracion) / 60).toFixed(2))
        : 0;
      const distanciaMetros = Number(fuente.distancia_metros || 0);
      const montoAdicional = Number(
        fuente.monto_adicional !== undefined
          ? fuente.monto_adicional
          : (distanciaMetros * 0.10).toFixed(2)
      );
      const tarifaBaseObtenida = tarifaBase > 0 ? tarifaBase : totalCobro;
      const montoObtenido = Number((tarifaBaseObtenida + montoAdicional).toFixed(2));
      setResumenFinalizacion({
        mascota,
        duracionProgramada: Number(fuente.duracion_minutos || servicio.duracion_minutos || duracion),
        distanciaMetros,
        montoObtenido,
        montoNeto: Number((montoObtenido * 0.8).toFixed(2)),
      });
      limpiarServicioActivo();
      setRuta([]);
      rutaRef.current = [];
      setDestinoPos(null);
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'updatePaseador', lat: miPos?.[0], lng: miPos?.[1], route: [], destino: null },
          '*'
        );
      }
      Alert.alert("¡Paseo finalizado!", "El paseo ha finalizado.");
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo finalizar el servicio.");
    } finally {
      setFinalizandoServicio(false);
    }
  };

  const finalizarServicio = () => {
    const servicioId = servicioActivo?.servicio_id || servicioActivoRef.current?.servicio_id;
    if (!servicioId || finalizandoServicio) return;

    setShowFinalizarModal(true);
  };

  const cancelarPaseoAsync = async () => {
    const servicioId = servicioActivo?.servicio_id || servicioActivoRef.current?.servicio_id;
    const paseadorId = getPaseadorId(usuario);
    console.log("[Cancelar paseo] Intento", {
      servicioId,
      paseadorId,
      estado: servicioActivo?.estado || servicioActivoRef.current?.estado || null,
    });
    if (!servicioId || !paseadorId) {
      console.warn("[Cancelar paseo] Datos incompletos", { servicioId, paseadorId });
      return;
    }

    const respuesta = await apiFetch(`/servicio/${servicioId}/cancelar`, {
      method: "PUT",
      body: JSON.stringify({ paseador_id: paseadorId }),
    });
    console.log("[Cancelar paseo] Respuesta del servidor", respuesta);
    limpiarServicioActivo();
  };

  const cancelarPaseo = () => {
    console.log("[Cancelar paseo] Boton presionado", {
      servicioId: servicioActivo?.servicio_id || servicioActivoRef.current?.servicio_id || null,
      finalizandoServicio,
    });
    if (finalizandoServicio) {
      console.warn("[Cancelar paseo] Bloqueado porque el servicio está finalizando");
      return;
    }
    setShowCancelarModal(true);
  };

  const confirmarCancelarPaseo = async () => {
    try {
      setShowCancelarModal(false);
      await cancelarPaseoAsync();
      Alert.alert("Paseo cancelado", "El paseo se canceló correctamente.");
    } catch (error) {
      console.error("[Cancelar paseo] Error en la petición", error);
      Alert.alert("Error", error.message || "No se pudo cancelar el paseo.");
    }
  };

  useEffect(() => {
    if (!llegadaExpiraEn || !servicioActivo) return;

    const actualizarLlegada = () => {
      const ahora = Date.now();
      setLlegadaClock(ahora);
    };

    actualizarLlegada();
    const intervalId = setInterval(actualizarLlegada, 1000);
    return () => clearInterval(intervalId);
  }, [llegadaExpiraEn, servicioActivo]);

  const confirmarFinalizarServicio = () => {
    const servicioId = servicioActivo?.servicio_id || servicioActivoRef.current?.servicio_id;
    const paseadorId = getPaseadorId(usuario);
    if (!servicioId || !paseadorId || finalizandoServicio) return;

    setShowFinalizarModal(false);
    setEsperandoEntregaFinal(true);
    socket.emit("paseador:entrega:solicitar", { servicioId, paseadorId });
  };

  const solicitarEntregaFinal = () => {
    const servicioId = servicioActivo?.servicio_id || servicioActivoRef.current?.servicio_id;
    const paseadorId = getPaseadorId(usuario);
    if (!servicioId || !paseadorId) return;
    setShowEntregaFinalModal(false);
    setEsperandoEntregaFinal(true);
    socket.emit("paseador:entrega:solicitar", { servicioId, paseadorId });
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("PerfilPaseador")} style={styles.headerBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        <Text style={styles.titleText}>Inicio</Text>

        <View style={styles.headerRight}>
          <View style={[styles.dot, { backgroundColor: conectado ? "#28a745" : "#dc3545" }]} />
          <TouchableOpacity
            style={[styles.statusBtn, conectado ? styles.statusBtnOnline : styles.statusBtnOffline]}
            onPress={toggleConectado}
          >
            <Text style={styles.statusBtnText}>{conectado ? "En línea" : "Fuera de línea"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {prorrogaEntregaExpiraEn ? (
        <View style={styles.prorrogaCard}>
          <Text style={styles.prorrogaText}>Te damos más tiempo para la entrega de las mascotas.</Text>
          <Text style={styles.prorrogaTimer}>
            {formatTime(Math.max(0, Math.ceil((prorrogaEntregaExpiraEn - prorrogaAhora) / 1000)))}
          </Text>
        </View>
      ) : null}

      {mensajeAlertaEntrega ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => {
            setMensajeAlertaEntrega("");
            navigation.reset({ index: 0, routes: [{ name: "InicioPaseador" }] });
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Aviso importante</Text>
              <Text style={styles.modalMessage}>{mensajeAlertaEntrega}</Text>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={() => {
                  setMensajeAlertaEntrega("");
                  navigation.reset({ index: 0, routes: [{ name: "InicioPaseador" }] });
                }}
              >
                <Text style={styles.modalConfirmText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      ) : null}

      {/* BANNER SERVICIO ACTIVO (sobre el mapa) */}
      {servicioActivo && (
        <View style={styles.activoBanner}>
          <View style={styles.activoBannerHeader}>
            <Text style={styles.activoText}>
              {String(servicioActivo.estado || "").toLowerCase() === "activo"
                ? "Caminata en proceso"
                : "Dirigete a la direccion marcada en el mapa"}
            </Text>
            {String(servicioActivo.estado || "").toLowerCase() === "activo" ? (
              <Text style={styles.llegadaCronometro}>{formatTime(tiempoRestanteSegundos)}</Text>
            ) : llegadaExpiraEn ? (
              <Text style={styles.llegadaCronometro}>{formatTime(tiempoLlegadaRestante)}</Text>
            ) : null}
          </View>
          <View style={styles.activoBannerInfo}>
            <View style={styles.direccionCard}>
              <Text style={styles.direccionTitle}>Direccion a dirigirse</Text>
              <Text style={styles.direccionValue}>{getDireccionCliente(servicioActivo)}</Text>
            </View>
            <View style={styles.activoBannerFooter}>
              <Text style={styles.duenoNombre} numberOfLines={1}>
                Dueño: {servicioActivo.dueno_nombre || "Cliente"}
              </Text>
              <TouchableOpacity
                style={[styles.btnCancelarPaseo, finalizandoServicio && styles.btnFinalizarDisabled]}
                onPress={String(servicioActivo.estado || "").toLowerCase() === "activo" ? finalizarServicio : cancelarPaseo}
                disabled={finalizandoServicio}
              >
                <Text style={styles.btnFinalizarText}>
                  {String(servicioActivo.estado || "").toLowerCase() === "activo"
                    ? "Caminata concluida"
                    : "Cancelar paseo"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {resumenFinalizacion && (
        <View style={styles.resumenCard}>
          <View style={styles.resumenHeader}>
            <Text style={styles.resumenTitle}>Resumen del paseo</Text>
            <TouchableOpacity onPress={cerrarResumenFinalizacion} style={styles.resumenCloseBtn}>
              <Text style={styles.resumenCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Mascota:</Text>
            <Text style={styles.resumenValue}>{resumenFinalizacion.mascota}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Duración seleccionada:</Text>
            <Text style={styles.resumenValue}>{resumenFinalizacion.duracionProgramada} min</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Distancia total:</Text>
            <Text style={styles.resumenValue}>{resumenFinalizacion.distanciaMetros} m</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Monto obtenido:</Text>
            <Text style={styles.resumenValue}>${Number(resumenFinalizacion.montoObtenido || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Monto total (- 20%):</Text>
            <Text style={styles.resumenValue}>${Number(resumenFinalizacion.montoNeto || 0).toFixed(2)}</Text>
          </View>
        </View>
      )}

      <Modal
        visible={showFinalizarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFinalizarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Entrega final</Text>
            <Text style={styles.modalMessage}>¿Entregaste a las mascotas?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowFinalizarModal(false)}
                disabled={finalizandoServicio}
              >
                <Text style={styles.modalCancelText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.modalConfirmBtn,
                  finalizandoServicio && styles.modalBtnDisabled,
                ]}
                onPress={confirmarFinalizarServicio}
                disabled={finalizandoServicio}
              >
                <Text style={styles.modalConfirmText}>
                  {finalizandoServicio ? "Finalizando..." : "Sí"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCancelarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cancelar paseo</Text>
            <Text style={styles.modalMessage}>¿Deseas cancelar este paseo?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowCancelarModal(false)}
              >
                <Text style={styles.modalCancelText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={confirmarCancelarPaseo}
              >
                <Text style={styles.modalConfirmText}>Sí, cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRecogidaModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRecogidaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Llegaste al domicilio</Text>
            <Text style={styles.modalMessage}>
              {recogidaEsRecordatorio
                ? "Llegaste al domicilio. El cliente aún no confirma la entrega. ¿Recibiste las mascotas?"
                : "Llegaste al domicilio. ¿Recibiste las mascotas del cliente?"}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={() => {
                  setShowRecogidaModal(false);
                  setRecogidaEsRecordatorio(false);
                }}
              >
                <Text style={styles.modalConfirmText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalYesBtn]}
                onPress={() => {
                  setShowRecogidaModal(false);
                  setRecogidaEsRecordatorio(false);
                  socket.emit("paseador:recogida:confirmada", {
                    servicioId: recogidaServicioId,
                    paseadorId: getPaseadorId(usuario),
                  });
                }}
              >
                <Text style={styles.modalConfirmText}>Sí</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MAPA */}
      <View style={styles.mapWrapper}>
        {isWeb ? (
          <iframe
            key={mapVersion}
            ref={iframeRef}
            title="Mapa paseador"
            srcDoc={webMapHtml}
            sandbox="allow-scripts"
            onLoad={sendInitialPosition}
            style={{ width: "100%", height: "100%", border: "none", pointerEvents: "auto", touchAction: "none" }}
          />
        ) : (
          <LiveMap
            key={mapVersion}
            center={miPos}
            mapCommand={mapCommand}
            markers={
              miPos
                ? [
                    { position: miPos, label: "📍 Tu posición" },
                    ...(destinoPos ? [{ position: [destinoPos.latitude, destinoPos.longitude], label: "📍 Cliente" }] : []),
                  ]
                : []
            }
            route={destinoPos && miPos ? [miPos, [destinoPos.latitude, destinoPos.longitude]] : ruta}
          />
        )}
        <View style={styles.controlesMapa}>
          <TouchableOpacity style={styles.controlMapaBtn} onPress={() => cambiarZoomMapa(1)}>
            <Text style={styles.controlMapaText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlMapaBtn} onPress={() => cambiarZoomMapa(-1)}>
            <Text style={styles.controlMapaText}>−</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.localizarPaseadorBtn}
          onPress={posicionarMapa}
          onMouseEnter={() => setLocationButtonHovered(true)}
          onMouseLeave={() => setLocationButtonHovered(false)}
          onPressIn={() => setLocationButtonHovered(true)}
          onPressOut={() => setLocationButtonHovered(false)}
        >
          <Text style={styles.localizarPaseadorIcon}>📍</Text>
          {locationButtonHovered ? (
            <Text style={styles.localizarPaseadorLabel}>Ubicación actual</Text>
          ) : null}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.paseosScroll} contentContainerStyle={styles.paseosScrollContent}>
      <View style={styles.ubicacionPaseadorCard}>
        <Text style={styles.ubicacionPaseadorTitle}>Ubicación actual del paseador</Text>
        <Text style={styles.ubicacionPaseadorStreet}>
          Calle: {calleActual || "Buscando calle..."}
        </Text>
        {miPos ? (
          <Text style={styles.ubicacionPaseadorCoords}>
            Lat: {Number(miPos[0]).toFixed(6)}{"     "}Lng: {Number(miPos[1]).toFixed(6)}
          </Text>
        ) : (
          <Text style={styles.ubicacionPaseadorCoords}>Obteniendo ubicación...</Text>
        )}
      </View>

      {/* SECCIÓN PASEOS DISPONIBLES */}
      <View style={styles.paseosSection}>
        <Text style={styles.paseosSectionTitle}>Paseos disponibles</Text>

        {solicitudesPendientes.length > 0 ? (
          solicitudesPendientes.map((solicitudPendiente) => {
            return (
            <View key={solicitudPendiente.servicio_id} style={styles.solicitudCard}>
              {/* Lado izquierdo: info del usuario */}
              <View style={styles.cardLeft}>
                <Text style={styles.cardUser}>
                  {solicitudPendiente.dueno_nombre || `User${solicitudPendiente.dueno_id}`}
                </Text>
                <Text style={styles.cardMascota}>
                  Mascotas: {solicitudPendiente.mascotas?.length > 0
                    ? solicitudPendiente.mascotas.map((m) => m.mascota_nombre).join(", ")
                    : (solicitudPendiente.mascota_nombre || `#${solicitudPendiente.mascota_id}`)}
                </Text>
                <Text style={styles.cardHint}>Toca para ver más información</Text>
              </View>

              {/* Lado derecho: nota + botones */}
              <View style={styles.cardRight}>
                <Text style={styles.cardNota} numberOfLines={1}>
                  Nota : {solicitudPendiente.notas_dueno || solicitudPendiente.notas || "Sin notas"}
                </Text>
                <View style={styles.cardBtns}>
                  <TouchableOpacity
                    style={styles.btnMatch}
                    onPress={() => aceptarServicio(solicitudPendiente)}
                  >
                    <Text style={styles.btnMatchText}>🐾 MATCH</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnRechazar}
                    onPress={() => {
                      console.log("[Cancelar paseo] Boton de solicitud presionado", {
                        servicioId: solicitudPendiente.servicio_id,
                      });
                      rechazarServicio(solicitudPendiente);
                    }}
                  >
                    <Text style={styles.btnRechazarText}>Cancelar paseo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            );
          })
        ) : (
          <Text style={styles.sinSolicitudes}>Sin solicitudes pendientes</Text>
        )}

        {mascotasListasServicioId ? (
          <TouchableOpacity
            style={styles.mascotasListasCard}
            onPress={() => navigation.navigate("verMascotasAPasear", { servicioId: mascotasListasServicioId })}
          >
            <Text style={styles.mascotasListasTitle}>Mascotas listas para pasear</Text>
            <Text style={styles.mascotasListasHint}>Toca para ver sus cuidados</Text>
          </TouchableOpacity>
        ) : null}

        {servicioActivo && String(servicioActivo.estado || "").toLowerCase() === "activo" ? (
          <TouchableOpacity
            style={styles.mascotasListasCard}
            onPress={() => navigation.navigate("verMascotasAPasear", {
              servicioId: servicioActivo.servicio_id,
            })}
          >
            <Text style={styles.mascotasListasTitle}>Mascotas en caminata</Text>
            <Text style={styles.mascotasListasNames}>
              {servicioActivo.mascota_nombre || "Mascotas del cliente"}
            </Text>
            <Text style={styles.mascotasListasHint}>Toca para ver sus cuidados</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      </ScrollView>

      <Modal
        visible={showEntregaFinalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEntregaFinalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Caminata casi concluida</Text>
            <Text style={styles.modalMessage}>La caminata casi concluye, entregaste a las mascotas?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancelBtn]} onPress={() => setShowEntregaFinalModal(false)}>
                <Text style={styles.modalCancelText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalConfirmBtn]} onPress={solicitarEntregaFinal}>
                <Text style={styles.modalConfirmText}>Sí</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BARRA INFERIOR — 4 tabs sin Mapa */}
      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem} onPress={() => {}}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F2" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: s(16),
    paddingTop: vs(48),
    paddingBottom: vs(10),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerBtn: { padding: s(4) },
  menuIcon: { fontSize: ms(24), color: "#333" },
  titleText: { fontSize: ms(18), fontWeight: "bold", color: "#333" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: s(10) },
  dot: { width: s(10), height: s(10), borderRadius: s(5) },
  statusBtn: {
    borderRadius: s(18),
    paddingHorizontal: s(10),
    paddingVertical: vs(6),
  },
  statusBtnOnline: { backgroundColor: "#28a745" },
  statusBtnOffline: { backgroundColor: "#dc3545" },
  statusBtnText: { fontSize: ms(12), fontWeight: "700", color: "#fff" },
  backIcon: { fontSize: ms(20), color: "#333" },

  ubicacionPaseadorCard: {
    backgroundColor: "#F3EBDD",
    marginHorizontal: s(16),
    marginTop: vs(10),
    marginBottom: vs(4),
    borderRadius: s(12),
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    borderWidth: 1,
    borderColor: "#E4D5BF",
  },
  ubicacionPaseadorTitle: {
    color: "#5B4636",
    fontSize: ms(13),
    fontWeight: "800",
    marginBottom: vs(4),
  },
  ubicacionPaseadorStreet: {
    color: "#5B4636",
    fontSize: ms(12),
    fontWeight: "700",
    marginBottom: vs(4),
  },
  ubicacionPaseadorCoords: {
    color: "#715B49",
    fontSize: ms(12),
    lineHeight: vs(18),
  },

  // Banner servicio activo (flotante sobre mapa)
  activoBanner: {
    backgroundColor: "#99D9C1",
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
  },
  prorrogaCard: {
    backgroundColor: "#FFF3CD",
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: s(10),
  },
  prorrogaText: { flex: 1, color: "#664D03", fontSize: ms(13), fontWeight: "700" },
  prorrogaTimer: {
    minWidth: s(62),
    backgroundColor: "#fff",
    borderRadius: s(8),
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    color: "#B42318",
    fontSize: ms(16),
    fontWeight: "800",
    textAlign: "center",
  },
  activoBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: s(10),
  },
  activoBannerInfo: { flex: 1 },
  activoBannerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: s(10),
    marginTop: vs(8),
  },
  duenoNombre: {
    flexShrink: 1,
    color: "#14532D",
    fontSize: ms(12),
    fontWeight: "700",
  },
  activoText: { fontSize: ms(13), fontWeight: "bold", color: "#1a1a1a", flex: 1 },
  llegadaCronometro: {
    minWidth: s(58),
    paddingHorizontal: s(8),
    paddingVertical: vs(5),
    borderRadius: s(8),
    backgroundColor: "#fff",
    color: "#b42318",
    fontSize: ms(16),
    fontWeight: "800",
    textAlign: "center",
  },
  cronometroText: { fontSize: ms(12), color: "#1f4d3f", fontWeight: "700", marginTop: vs(2) },
  direccionCard: {
    marginTop: vs(6),
    backgroundColor: "#ECFDF3",
    borderRadius: s(10),
    paddingHorizontal: s(10),
    paddingVertical: vs(8),
    borderWidth: 1,
    borderColor: "#73C6A6",
  },
  direccionTitle: {
    fontSize: ms(11),
    color: "#14532D",
    fontWeight: "700",
    marginBottom: vs(2),
  },
  direccionValue: {
    fontSize: ms(12),
    color: "#0F3D2E",
    fontWeight: "800",
  },
  btnFinalizar: {
    backgroundColor: "#2E7D4F",
    borderRadius: s(8),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
  },
  btnCancelarPaseo: {
    marginLeft: "auto",
    backgroundColor: "#b42318",
    borderRadius: s(8),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
  },
  btnFinalizarDisabled: { opacity: 0.7 },
  btnFinalizarText: { color: "#fff", fontWeight: "bold", fontSize: ms(12) },

  mascotasListasCard: {
    backgroundColor: "#99D9C1",
    marginHorizontal: s(16),
    marginTop: vs(10),
    borderRadius: s(14),
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
  },
  mascotasListasTitle: { color: "#1F2A26", fontSize: ms(15), fontWeight: "700" },
  mascotasListasNames: { color: "#1F4D36", fontSize: ms(13), fontWeight: "700", marginTop: vs(4) },
  mascotasListasHint: { color: "#1F4D36", fontSize: ms(12), fontWeight: "600", marginTop: vs(3) },

  resumenCard: {
    backgroundColor: "#99D9C1",
    marginHorizontal: s(16),
    borderRadius: s(18),
    padding: s(18),
    marginBottom: vs(16),
    borderWidth: 1,
    borderColor: "#73C6A6",
    shadowColor: "#0f3b2d",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  resumenTitle: {
    fontSize: ms(16),
    fontWeight: "bold",
    color: "#114B36",
    marginBottom: vs(12),
  },
  resumenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(12),
  },
  resumenCloseBtn: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: "#ECFDF3",
    alignItems: "center",
    justifyContent: "center",
  },
  resumenCloseText: {
    fontSize: ms(16),
    color: "#14532D",
    fontWeight: "700",
  },
  resumenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: vs(10),
  },
  resumenLabel: {
    fontSize: ms(14),
    color: "#14532D",
  },
  resumenValue: {
    fontSize: ms(14),
    fontWeight: "800",
    color: "#0F3D2E",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: s(24),
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: s(16),
    paddingHorizontal: s(18),
    paddingVertical: vs(16),
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  modalTitle: {
    fontSize: ms(17),
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: vs(8),
  },
  modalMessage: {
    fontSize: ms(14),
    color: "#444",
    marginBottom: vs(14),
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: s(10),
  },
  modalBtn: {
    borderRadius: s(10),
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    minWidth: s(92),
    alignItems: "center",
  },
  modalCancelBtn: {
    backgroundColor: "#e9ecef",
  },
  modalConfirmBtn: {
    backgroundColor: "#dc3545",
  },
  modalYesBtn: {
    backgroundColor: "#28a745",
  },
  modalCancelText: {
    color: "#333",
    fontWeight: "700",
    fontSize: ms(13),
  },
  modalConfirmText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: ms(13),
  },
  modalBtnDisabled: {
    opacity: 0.7,
  },

  // Mapa
  mapWrapper: { flex: 1 },
  localizarPaseadorBtn: {
    position: "absolute",
    left: s(12),
    bottom: s(12),
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
    width: s(42),
    height: s(42),
    backgroundColor: "rgba(46, 204, 113, 0.95)",
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(7),
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  localizarPaseadorIcon: { color: "#fff", fontSize: ms(18) },
  localizarPaseadorLabel: {
    position: "absolute",
    top: "100%",
    left: 0,
    width: s(110),
    backgroundColor: "rgba(46, 204, 113, 0.95)",
    borderRadius: s(6),
    paddingVertical: vs(3),
    color: "#fff",
    fontSize: ms(11),
    fontWeight: "700",
    textAlign: "center",
  },
  controlesMapa: {
    position: "absolute",
    top: s(12),
    left: s(12),
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: s(8),
    overflow: "hidden",
    elevation: 4,
  },
  controlMapaBtn: {
    width: s(36),
    height: s(36),
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  controlMapaText: { color: "#222", fontSize: ms(24), lineHeight: ms(26) },

  // Sección "Paseos disponibles"
  paseosScroll: { flex: 1 },
  paseosScrollContent: { paddingBottom: vs(12) },
  paseosSection: {
    backgroundColor: "#fff",
    paddingHorizontal: s(16),
    paddingTop: vs(12),
    paddingBottom: vs(8),
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
    minHeight: vs(120),
  },
  paseosSectionTitle: {
    fontSize: ms(15),
    fontWeight: "700",
    color: "#333",
    marginBottom: vs(10),
  },
  sinSolicitudes: {
    fontSize: ms(13),
    color: "#999",
    textAlign: "center",
    paddingVertical: vs(12),
  },

  // Tarjeta de solicitud (estilo Figma)
  solicitudCard: {
    width: "100%",
    flexDirection: "column",
    backgroundColor: "#E8F8F2",
    borderRadius: s(14),
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardLeft: { width: "100%", gap: vs(4) },
  cardUser: { fontSize: ms(14), fontWeight: "700", color: "#222" },
  cardMascota: { fontSize: ms(12), color: "#555" },
  cardHint: { fontSize: ms(11), color: "#2E7D4F", fontWeight: "600" },
  cardTimer: { fontSize: ms(12), fontWeight: "700", color: "#2E7D4F" },
  cardTimerExpired: { color: "#C94B4B" },
  cardRight: { width: "100%", alignItems: "stretch", gap: vs(6) },
  cardNota: { fontSize: ms(12), color: "#555", width: "100%" },
  cardBtns: { flexDirection: "row", flexWrap: "wrap", gap: s(8), alignItems: "center" },
  btnMatch: {
    backgroundColor: "#7CEDA3",
    borderRadius: s(20),
    paddingHorizontal: s(14),
    paddingVertical: vs(7),
    flexDirection: "row",
    alignItems: "center",
  },
  btnMatchText: { color: "#fff", fontWeight: "bold", fontSize: ms(13) },
  btnRechazar: {
    backgroundColor: "#F06272",
    borderRadius: s(20),
    paddingHorizontal: s(14),
    paddingVertical: vs(7),
    flexDirection: "row",
    alignItems: "center",
  },
  btnRechazarText: { color: "#fff", fontWeight: "bold", fontSize: ms(13) },

  // Bottom tab
  bottomTab: {
    flexDirection: "row",
    backgroundColor: "#99D9C1",
    height: vs(65),
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: { alignItems: "center", gap: vs(2) },
  tabIcon: { fontSize: ms(20) },
  tabLabel: { fontSize: ms(10), fontWeight: "bold", color: "#1a1a1a" },
});
