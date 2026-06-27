import React, { useEffect, useState, useRef, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import useToast from "../../utils/useToast";
import ConfirmModal from "../../components/ConfirmModal";
import { s, vs, ms } from "../../utils/responsive";
import { getSocket } from "../../utils/socket";
import { apiFetch } from "../../utils/api";
import storage from "../../utils/storage";
import LiveMap from "../../components/LiveMap";
import { requestLocationPermission, getCurrentPosition, watchPosition } from "../../utils/geo";

const DEFAULT_LAT = 20.907715;
const DEFAULT_LNG = -100.707582;

export default function InicioPaseador({ navigation }) {
  const [usuario, setUsuario]               = useState(null);
  const [miPos, setMiPos]                   = useState(null);
  const [servicioActivo, setServicioActivo] = useState(null);
  const [estadoServicio, setEstadoServicio] = useState(null); // "en_camino" | "activo"
  const [mascotaActiva, setMascotaActiva]   = useState(null);
  const [solicitudPendiente, setSolicitudPendiente] = useState(null);
  const [ruta, setRuta]                     = useState([]);
  const [conectado, setConectado]           = useState(false);
  const [confirmFinalizar, setConfirmFinalizar] = useState(false);
  const [clientePickup, setClientePickup]       = useState(null); // {lat,lng,texto}
  const { showToast, ToastComponent } = useToast();

  const watchRef          = useRef(null);
  const servicioActivoRef = useRef(null);
  const iframeRef         = useRef(null);
  const rutaRef           = useRef([]);
  const clientePickupRef  = useRef(null);
  const isWeb             = Platform.OS === "web";
  const socket            = getSocket();

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
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);

    // Marcador del paseador (pin estándar de Leaflet)
    const paseadorIcon = L.icon({
      iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize:[25,41], iconAnchor:[12,41], popupAnchor:[1,-34], shadowSize:[41,41]
    });
    const paseadorMarker = L.marker([${DEFAULT_LAT},${DEFAULT_LNG}],
      {icon:paseadorIcon}).addTo(map).bindPopup('📍 Tu ubicación');

    let routeLine = null;
    let clienteMarker = null;

    window.addEventListener('message', function(ev) {
      if (!ev.data) return;
      const d = ev.data;

      if (d.type === 'updatePaseador') {
        paseadorMarker.setLatLng([d.lat, d.lng]);
        if (!clienteMarker) map.setView([d.lat, d.lng], map.getZoom(), {animate:true});
        if (d.route && d.route.length > 1) {
          if (routeLine) map.removeLayer(routeLine);
          routeLine = L.polyline(d.route, {color:'#7CEDA3', weight:4}).addTo(map);
        }
      }

      if (d.type === 'updateClientePickup') {
        const homeIcon = L.divIcon({
          html: '<div style="font-size:30px;line-height:30px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">🏠</div>',
          className: '', iconSize: [30, 30], iconAnchor: [15, 30]
        });
        if (!clienteMarker) {
          clienteMarker = L.marker([d.lat, d.lng], {icon: homeIcon})
            .addTo(map)
            .bindPopup(d.texto ? '📍 ' + d.texto : '🏠 Dirección del cliente')
            .openPopup();
        } else {
          clienteMarker.setLatLng([d.lat, d.lng]);
        }
        // Ajustar vista para mostrar ambos marcadores
        const bounds = L.latLngBounds(
          [paseadorMarker.getLatLng(), [d.lat, d.lng]]
        );
        map.fitBounds(bounds, {padding: [60, 60], maxZoom: 17});
      }

      if (d.type === 'clearClientePickup') {
        if (clienteMarker) { map.removeLayer(clienteMarker); clienteMarker = null; }
      }
    });
  </script>
</body>
</html>`, []);

  // ─── Inicialización ─────────────────────────────────────────────────────────
  useEffect(() => {
    const u = JSON.parse(storage.getItem("usuario") || "{}");
    setUsuario(u);

    const registrarOnline = () => {
      if (u.usuario_id) {
        socket.emit("paseador:online", { paseadorId: u.usuario_id });
        setConectado(true);
      }
    };

    // Registrar en cada conexión/reconexión del socket
    socket.on("connect", registrarOnline);
    // Si el socket ya estaba conectado al montar el componente
    if (socket.connected) registrarOnline();

    iniciarGPS();
    socket.on("servicio:nuevo", (data) => setSolicitudPendiente(data));
    return () => {
      socket.off("connect", registrarOnline);
      socket.off("servicio:nuevo");
      detenerGPS();
    };
  }, []);

  // ─── GPS ────────────────────────────────────────────────────────────────────
  const iniciarGPS = async () => {
    if (watchRef.current) return;
    const ok = await requestLocationPermission();
    if (!ok) {
      showToast("Activa los permisos de ubicación para el seguimiento GPS.", "warning");
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
          type: "updatePaseador", lat, lng, route: rutaRef.current,
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
        type: "updatePaseador", lat: miPos[0], lng: miPos[1], route: rutaRef.current,
      }, "*");
    }
    if (clientePickupRef.current && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: "updateClientePickup",
        lat:   clientePickupRef.current.lat,
        lng:   clientePickupRef.current.lng,
        texto: clientePickupRef.current.texto,
      }, "*");
    }
  };

  // Enviar pickup al iframe después de cada re-render (más confiable que en el handler directo)
  useEffect(() => {
    if (!clientePickup || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({
      type:  "updateClientePickup",
      lat:   clientePickup.lat,
      lng:   clientePickup.lng,
      texto: clientePickup.texto,
    }, "*");
  }, [clientePickup]);

  // ─── Acciones de servicio ────────────────────────────────────────────────────
  const aceptarServicio = async () => {
    if (!solicitudPendiente || !usuario) return;
    try {
      const servicio = await apiFetch(`/servicio/${solicitudPendiente.servicio_id}/aceptar`, {
        method: "PUT",
        body: JSON.stringify({ paseadorId: usuario.usuario_id }),
      });
      servicioActivoRef.current = servicio;
      setServicioActivo(servicio);
      setEstadoServicio("en_camino");
      setMascotaActiva(solicitudPendiente.mascota_nombre || null);

      // Mostrar dirección de recogida del cliente en el mapa
      if (solicitudPendiente.lat && solicitudPendiente.lng) {
        const pickup = {
          lat:   solicitudPendiente.lat,
          lng:   solicitudPendiente.lng,
          texto: solicitudPendiente.direccion_texto || null,
        };
        clientePickupRef.current = pickup;
        setClientePickup(pickup); // dispara useEffect → postMessage después del re-render
      }

      setSolicitudPendiente(null);
      iniciarGPS();
      showToast("¡Servicio aceptado! Ve a recoger a la mascota.", "success");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const rechazarServicio = async () => {
    if (!solicitudPendiente) return;
    try {
      await apiFetch(`/servicio/${solicitudPendiente.servicio_id}/rechazar`, { method: "PUT" });
      setSolicitudPendiente(null);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const finalizarServicio = () => setConfirmFinalizar(true);

  const confirmarFinalizar = () => {
    socket.emit("servicio:finalizar", { servicioId: servicioActivo.servicio_id });
    detenerGPS();
    servicioActivoRef.current = null;
    clientePickupRef.current  = null;
    setClientePickup(null);
    setServicioActivo(null);
    setEstadoServicio(null);
    setMascotaActiva(null);
    rutaRef.current = [];
    setRuta([]);
    iframeRef.current?.contentWindow?.postMessage({ type: "clearClientePickup" }, "*");
    setConfirmFinalizar(false);
    showToast("¡Paseo finalizado! El cliente ha sido notificado.", "success");
  };

  const iniciarPaseo = async () => {
    if (!servicioActivo) return;
    try {
      await apiFetch(`/servicio/${servicioActivo.servicio_id}/iniciar-paseo`, { method: "PUT" });
      setEstadoServicio("activo");
      showToast("¡Paseo iniciado! El cliente fue notificado.", "success");
    } catch (e) {
      showToast(e.message || "Error al iniciar paseo", "error");
    }
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Text style={styles.backIcon}>↩</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BANNER SERVICIO ACTIVO (sobre el mapa) */}
      {servicioActivo && (
        <View style={styles.activoBanner}>
          {estadoServicio === "en_camino" ? (
            <>
              <View style={{ flex: 1 }}>
                <Text style={styles.activoText}>
                  🚶 En camino a recoger a {mascotaActiva || "la mascota"}
                </Text>
                {clientePickup?.texto ? (
                  <Text style={styles.activoDirText}>📍 {clientePickup.texto}</Text>
                ) : null}
              </View>
              <TouchableOpacity style={styles.btnIniciarPaseo} onPress={iniciarPaseo}>
                <Text style={styles.btnIniciarPaseoText}>🐾 Recoger mascota</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.activoText}>🐕 Paseo en curso — GPS activo</Text>
              <TouchableOpacity style={styles.btnFinalizar} onPress={finalizarServicio}>
                <Text style={styles.btnFinalizarText}>Finalizar</Text>
              </TouchableOpacity>
            </>
          )}
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
            markers={miPos ? [{ position: miPos, label: "📍 Tu posición" }] : []}
            route={ruta}
          />
        )}
      </View>

      {/* SECCIÓN PASEOS DISPONIBLES */}
      <View style={styles.paseosSection}>
        <Text style={styles.paseosSectionTitle}>Paseos disponibles</Text>

        {solicitudPendiente ? (
          <View style={styles.solicitudCard}>
            {/* Lado izquierdo: info del usuario */}
            <View style={styles.cardLeft}>
              <Text style={styles.cardUser}>
                {solicitudPendiente.dueno_nombre || `Cliente #${solicitudPendiente.dueno_id}`}
              </Text>
              <Text style={styles.cardMascota}>
                🐶 {solicitudPendiente.mascota_nombre || `Mascota #${solicitudPendiente.mascota_id}`}
              </Text>
              <Text style={styles.cardMascota}>
                🦮 {solicitudPendiente.tipo_servicio}  ·  ⏱ {solicitudPendiente.duracion_minutos} min
              </Text>
            </View>

            {/* Lado derecho: nota + botones */}
            <View style={styles.cardRight}>
              <Text style={styles.cardNota} numberOfLines={1}>
                Nota : {solicitudPendiente.notas || "Sin notas"}
              </Text>
              <View style={styles.cardBtns}>
                <TouchableOpacity style={styles.btnMatch} onPress={aceptarServicio}>
                  <Text style={styles.btnMatchText}>🐾 MATCH</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnX} onPress={rechazarServicio}>
                  <Text style={styles.btnXText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.sinSolicitudes}>Sin solicitudes pendientes</Text>
        )}
      </View>

      {/* BARRA INFERIOR — 4 tabs sin Mapa */}
      <ConfirmModal
        visible={confirmFinalizar}
        title="Finalizar paseo"
        message="¿Estás seguro de que deseas finalizar el paseo?"
        confirmText="Finalizar"
        cancelText="Cancelar"
        confirmColor="#E6B5B5"
        onConfirm={confirmarFinalizar}
        onCancel={() => setConfirmFinalizar(false)}
      />
      {ToastComponent}

      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem} onPress={() => {}}>
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={styles.tabLabel}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("PaseosPaseador")}>
          <Text style={styles.tabIcon}>✅</Text>
          <Text style={styles.tabLabel}>Paseos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("NotificacionesUsuario")}>
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
  activoText: { fontSize: ms(13), fontWeight: "bold", color: "#1a1a1a" },
  activoDirText: { fontSize: ms(11), color: "#1a4731", marginTop: vs(2) },
  btnFinalizar: {
    backgroundColor: "#dc3545",
    borderRadius: s(8),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
  },
  btnFinalizarText: { color: "#fff", fontWeight: "bold", fontSize: ms(12) },

  btnIniciarPaseo: {
    backgroundColor: "#22a06b",
    borderRadius: s(8),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
  },
  btnIniciarPaseoText: { color: "#fff", fontWeight: "bold", fontSize: ms(12) },

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
