import React, { useEffect, useState, useRef, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from "react-native";
import { s, vs, ms } from "../../utils/responsive";
import { getSocket } from "../../utils/socket";
import { apiFetch } from "../../utils/api";
import storage from "../../utils/storage";
import LiveMap from "../../components/LiveMap";
import { requestLocationPermission, getCurrentPosition, watchPosition } from "../../utils/geo";

const DEFAULT_LAT = 20.907715;
const DEFAULT_LNG = -100.707582;

export default function InicioPaseador({ route, navigation }) {
  const [usuario, setUsuario]               = useState(null);
  const [miPos, setMiPos]                   = useState(null);
  const [servicioActivo, setServicioActivo] = useState(null);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [ruta, setRuta]                     = useState([]);
  const [destinoPos, setDestinoPos]         = useState(null);
  const [conectado, setConectado]           = useState(false);
  const [esperandoConfirmacion, setEsperandoConfirmacion] = useState(false);
  const [pendienteConfirmacionId, setPendienteConfirmacionId] = useState(null);
  const [cronometroSegundos, setCronometroSegundos] = useState(0);
  const [finalizandoServicio, setFinalizandoServicio] = useState(false);
  const [resumenFinalizacion, setResumenFinalizacion] = useState(route?.params?.resumenFinalizacion || null);

  const conectadoRef = useRef(conectado);
  const pendienteConfirmacionIdRef = useRef(pendienteConfirmacionId);
  const watchRef          = useRef(null);
  const servicioActivoRef = useRef(null);
  const iframeRef         = useRef(null);
  const rutaRef           = useRef([]);
  const inicioServicioRef = useRef(null);
  const isWeb             = Platform.OS === "web";
  const socket            = getSocket();

  const getPaseadorId = (paseador) => Number(paseador?.paseador_id || paseador?.usuario_id || paseador?.id || 0);

  const parseDestino = (destino) => {
    const lat = Number(destino?.lat || destino?.direccion_latitud || destino?.latitud);
    const lng = Number(destino?.lng || destino?.direccion_longitud || destino?.longitud);
    return Number.isFinite(lat) && Number.isFinite(lng)
      ? { latitude: lat, longitude: lng }
      : null;
  };

  const activarServicio = (servicio, destino) => {
    if (!servicio) return;

    const nextId = Number(servicio.servicio_id);
    const currentId = Number(servicioActivoRef.current?.servicio_id);
    if (nextId && currentId && nextId === currentId) return;

    setEsperandoConfirmacion(false);
    setPendienteConfirmacionId(null);
    setServicioActivo(servicio);
    servicioActivoRef.current = servicio;
    setCronometroSegundos(0);
    setDestinoPos(destino || parseDestino(servicio));
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
    setCronometroSegundos(0);
    rutaRef.current = [];
    setRuta([]);
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

  const cargarSolicitudesPendientes = async () => {
    try {
      const data = await apiFetch("/servicios/pendientes");
      setSolicitudesPendientes(
        Array.isArray(data) ? data.map(normalizarSolicitud).filter(Boolean) : []
      );
    } catch (error) {
      console.error("❌ Error cargando solicitudes pendientes:", error);
    }
  };

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
    const map = L.map('map').setView([${DEFAULT_LAT},${DEFAULT_LNG}], 15);
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

    window.addEventListener('message', function(ev) {
      if (!ev.data) return;
      const d = ev.data;

      if (d.type === 'updatePaseador') {
        paseadorMarker.setLatLng([d.lat, d.lng]);
        map.setView([d.lat, d.lng], map.getZoom(), {animate:true});

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
    });
  </script>
</body>
</html>`, []);

  // ─── Inicialización ─────────────────────────────────────────────────────────
  useEffect(() => {
    const u = JSON.parse(storage.getItem("paseador") || storage.getItem("usuario") || "{}");
    const paseadorId = getPaseadorId(u);
    setUsuario(u);
    if (paseadorId) {
      socket.emit("paseador:online", { paseadorId });
      setConectado(true);
      cargarServicioActivoPaseador(paseadorId);
    }
    iniciarGPS();
    cargarSolicitudesPendientes();
    socket.on("servicio:nuevo", (data) => {
      if (!conectadoRef.current) return;
      const solicitud = normalizarSolicitud(data);
      if (!solicitud) return;

      setSolicitudesPendientes((current) => {
        const existe = current.some(
          (item) => Number(item.servicio_id) === Number(solicitud.servicio_id)
        );
        if (existe) return current;
        return [solicitud, ...current];
      });
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
      Alert.alert("¡Cliente aceptó!", "El paseo comienza. La ruta se mostrará aquí en Inicio.");
      if (navigation?.navigate) {
        navigation.navigate("InicioPaseador");
      }
    });

    socket.on("paseador:tarifa:rechazada", (payload) => {
      const servicioId = Number(payload?.servicio_id);
      if (!servicioId || servicioId !== pendienteConfirmacionIdRef.current) return;
      setEsperandoConfirmacion(false);
      setPendienteConfirmacionId(null);
      Alert.alert("Tarifa rechazada", "El cliente rechazó la tarifa. La solicitud vuelve a estar disponible.");
      cargarSolicitudesPendientes();
    });

    return () => {
      socket.off("servicio:nuevo");
      socket.off("paseador:servicio:confirmado");
      socket.off("paseador:tarifa:rechazada");
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
          Alert.alert("¡Cliente aceptó!", "El paseo comienza. La ruta se mostrará aquí en Inicio.");
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

  // ─── GPS ────────────────────────────────────────────────────────────────────
  const iniciarGPS = async () => {
    if (watchRef.current) return;
    const ok = await requestLocationPermission();
    if (!ok) {
      Alert.alert("Permiso de ubicación", "Activa los permisos de ubicación para el seguimiento GPS.");
      return;
    }
    const inicial = await getCurrentPosition();
    if (inicial) {
      setMiPos([inicial.lat, inicial.lng]);
    }
    watchRef.current = await watchPosition(
      ({ lat, lng }) => {
        const coord = [lat, lng];
        setMiPos(coord);
        rutaRef.current = [...rutaRef.current, coord];
        setRuta([...rutaRef.current]);
        // Actualizar iframe web
        iframeRef.current?.contentWindow?.postMessage({
          type: "updatePaseador",
          lat,
          lng,
          route: rutaRef.current,
          destino: destinoPos && Number.isFinite(destinoPos.latitude) && Number.isFinite(destinoPos.longitude)
            ? { lat: destinoPos.latitude, lng: destinoPos.longitude }
            : null,
        }, "*");
        // Emitir al cliente si hay servicio activo
        const activo = servicioActivoRef.current;
        if (activo) {
          socket.emit("paseador:location", { servicioId: activo.servicio_id, lat, lng });
        }
      },
      (err) => console.warn("GPS error:", err?.message)
    );
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

  useEffect(() => {
    if (destinoPos && miPos && iframeRef.current?.contentWindow) {
      sendInitialPosition();
    }
  }, [destinoPos, miPos]);

  useEffect(() => {
    servicioActivoRef.current = servicioActivo;
    if (!servicioActivo) {
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
        "Esperando la confirmación del cliente. En cuanto acepte, el paseo comenzará automáticamente.",
      );
    } catch (e) {
      console.error("Error aceptando servicio:", e);
      Alert.alert("Error", e.message || "No se pudo aceptar la solicitud.");
    }
  };

  const rechazarServicio = async (solicitudPendiente) => {
    if (!solicitudPendiente) return;
    try {
      await apiFetch(`/servicio/${solicitudPendiente.servicio_id}/rechazar`, { method: "PUT" });
      setSolicitudesPendientes((current) =>
        current.filter((item) => Number(item.servicio_id) !== Number(solicitudPendiente.servicio_id))
      );
    } catch (e) {
      Alert.alert("Error", e.message);
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
    const tiempo = formatTime(cronometroSegundos);

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
      const tarifaBaseMostrada = Number.isFinite(tarifaBase) && tarifaBase > 0 ? tarifaBase : totalCobro;
      const totalConDescuento = Number((tarifaBaseMostrada * 0.8).toFixed(2));
      const descuento = Number((tarifaBaseMostrada - totalConDescuento).toFixed(2));

      setResumenFinalizacion({ mascota, tiempo, tarifaBase: tarifaBaseMostrada, descuento, totalConDescuento });
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

    const confirmar = () => finalizarServicioAsync(servicioId);

    if (Platform.OS === "web") {
      const confirmResult = window.confirm("¿Estás seguro de finalizar el paseo?");
      if (confirmResult) confirmar();
      return;
    }

    Alert.alert("Finalizar paseo", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Finalizar", onPress: confirmar },
    ]);
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Text style={styles.backIcon}>↩</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BANNER SERVICIO ACTIVO (sobre el mapa) */}
      {servicioActivo && (
        <View style={styles.activoBanner}>
          <View style={styles.activoBannerInfo}>
            <Text style={styles.activoText}>🐕 Paseo en curso — GPS activo</Text>
            <Text style={styles.cronometroText}>
              {formatTime(cronometroSegundos)} / {formatTime((Number(servicioActivo?.duracion_minutos) || 0) * 60)}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.btnFinalizar, finalizandoServicio && styles.btnFinalizarDisabled]}
            onPress={finalizarServicio}
            disabled={finalizandoServicio}
          >
            <Text style={styles.btnFinalizarText}>{finalizandoServicio ? "Finalizando..." : "Finalizar"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {resumenFinalizacion && (
        <View style={styles.resumenCard}>
          <View style={styles.resumenHeader}>
            <Text style={styles.resumenTitle}>Resumen del paseo</Text>
            <TouchableOpacity onPress={() => setResumenFinalizacion(null)} style={styles.resumenCloseBtn}>
              <Text style={styles.resumenCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Mascota:</Text>
            <Text style={styles.resumenValue}>{resumenFinalizacion.mascota}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Tiempo:</Text>
            <Text style={styles.resumenValue}>{resumenFinalizacion.tiempo}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Tarifa base:</Text>
            <Text style={styles.resumenValue}>${resumenFinalizacion.tarifaBase.toFixed(2)}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Descuento 20%:</Text>
            <Text style={styles.resumenValue}>-${resumenFinalizacion.descuento.toFixed(2)}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Ganancia total:</Text>
            <Text style={styles.resumenValue}>${resumenFinalizacion.totalConDescuento.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {/* MAPA */}
      <View style={styles.mapWrapper}>
        {isWeb ? (
          <iframe
            ref={iframeRef}
            title="Mapa paseador"
            srcDoc={webMapHtml}
            sandbox="allow-scripts"
            onLoad={sendInitialPosition}
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        ) : (
          <LiveMap
            center={miPos}
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
      </View>

      {/* SECCIÓN PASEOS DISPONIBLES */}
      <View style={styles.paseosSection}>
        <Text style={styles.paseosSectionTitle}>Paseos disponibles</Text>

        {solicitudesPendientes.length > 0 ? (
          solicitudesPendientes.map((solicitudPendiente) => (
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
              </View>

              {/* Lado derecho: nota + botones */}
              <View style={styles.cardRight}>
                <Text style={styles.cardNota} numberOfLines={1}>
                  Nota : {solicitudPendiente.notas_dueno || solicitudPendiente.notas || "Sin notas"}
                </Text>
                <View style={styles.cardBtns}>
                  <TouchableOpacity style={styles.btnMatch} onPress={() => aceptarServicio(solicitudPendiente)}>
                    <Text style={styles.btnMatchText}>🐾 MATCH</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnX} onPress={() => rechazarServicio(solicitudPendiente)}>
                    <Text style={styles.btnXText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.sinSolicitudes}>Sin solicitudes pendientes</Text>
        )}
      </View>

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

  // Banner servicio activo (flotante sobre mapa)
  activoBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#99D9C1",
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
  },
  activoBannerInfo: { flex: 1 },
  activoText: { fontSize: ms(13), fontWeight: "bold", color: "#1a1a1a", flex: 1 },
  cronometroText: { fontSize: ms(12), color: "#1f4d3f", fontWeight: "700", marginTop: vs(2) },
  btnFinalizar: {
    backgroundColor: "#dc3545",
    borderRadius: s(8),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
  },
  btnFinalizarDisabled: { opacity: 0.7 },
  btnFinalizarText: { color: "#fff", fontWeight: "bold", fontSize: ms(12) },

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

  // Mapa
  mapWrapper: { flex: 1 },

  // Sección "Paseos disponibles"
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
    flexDirection: "row",
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
  cardLeft: { flex: 1, gap: vs(4) },
  cardUser: { fontSize: ms(14), fontWeight: "700", color: "#222" },
  cardMascota: { fontSize: ms(12), color: "#555" },
  cardRight: { alignItems: "flex-end", gap: vs(6) },
  cardNota: { fontSize: ms(12), color: "#555", maxWidth: s(160) },
  cardBtns: { flexDirection: "row", gap: s(8), alignItems: "center" },
  btnMatch: {
    backgroundColor: "#7CEDA3",
    borderRadius: s(20),
    paddingHorizontal: s(14),
    paddingVertical: vs(7),
    flexDirection: "row",
    alignItems: "center",
  },
  btnMatchText: { color: "#fff", fontWeight: "bold", fontSize: ms(13) },
  btnX: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  btnXText: { fontSize: ms(14), color: "#999", fontWeight: "bold" },

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
