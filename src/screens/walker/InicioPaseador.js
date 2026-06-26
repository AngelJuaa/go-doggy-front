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

export default function InicioPaseador({ navigation }) {
  const [usuario, setUsuario]               = useState(null);
  const [miPos, setMiPos]                   = useState(null);
  const [servicioActivo, setServicioActivo] = useState(null);
  const [solicitudPendiente, setSolicitudPendiente] = useState(null);
  const [ruta, setRuta]                     = useState([]);
  const [conectado, setConectado]           = useState(false);

  const watchRef          = useRef(null);
  const servicioActivoRef = useRef(null);
  const iframeRef         = useRef(null);
  const rutaRef           = useRef([]);
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

    window.addEventListener('message', function(ev) {
      if (!ev.data) return;
      const d = ev.data;

      if (d.type === 'updatePaseador') {
        paseadorMarker.setLatLng([d.lat, d.lng]);
        map.setView([d.lat, d.lng], map.getZoom(), {animate:true});
        if (d.route && d.route.length > 1) {
          if (routeLine) map.removeLayer(routeLine);
          routeLine = L.polyline(d.route, {color:'#7CEDA3', weight:4}).addTo(map);
        }
      }
    });
  </script>
</body>
</html>`, []);

  // ─── Inicialización ─────────────────────────────────────────────────────────
  useEffect(() => {
    const u = JSON.parse(storage.getItem("usuario") || "{}");
    setUsuario(u);
    if (u.usuario_id) {
      socket.emit("paseador:online", { paseadorId: u.usuario_id });
      setConectado(true);
    }
    iniciarGPS();
    socket.on("servicio:nuevo", (data) => setSolicitudPendiente(data));
    return () => {
      socket.off("servicio:nuevo");
      detenerGPS();
    };
  }, []);

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
  };

  // ─── Acciones de servicio ────────────────────────────────────────────────────
  const aceptarServicio = async () => {
    if (!solicitudPendiente || !usuario?.usuario_id) return;
    try {
      const servicio = await apiFetch(`/servicio/${solicitudPendiente.servicio_id}/aceptar`, { 
        method: "PUT",
        body: JSON.stringify({ paseador_id: usuario.usuario_id })
      });
      servicioActivoRef.current = servicio;
      setServicioActivo(servicio);
      setSolicitudPendiente(null);
      iniciarGPS();
      Alert.alert("✅ Servicio aceptado", "Tu ubicación GPS se está enviando al cliente.");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const rechazarServicio = async () => {
    if (!solicitudPendiente) return;
    try {
      await apiFetch(`/servicio/${solicitudPendiente.servicio_id}/rechazar`, { method: "PUT" });
      setSolicitudPendiente(null);
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const finalizarServicio = () => {
    Alert.alert("Finalizar paseo", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Finalizar",
        onPress: () => {
          socket.emit("servicio:finalizar", { servicioId: servicioActivo.servicio_id });
          detenerGPS();
          servicioActivoRef.current = null;
          setServicioActivo(null);
          rutaRef.current = [];
          setRuta([]);
          Alert.alert("¡Paseo finalizado!", "El cliente ha sido notificado.");
        },
      },
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Text style={styles.backIcon}>↩</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BANNER SERVICIO ACTIVO (sobre el mapa) */}
      {servicioActivo && (
        <View style={styles.activoBanner}>
          <Text style={styles.activoText}>🐕 Paseo en curso — GPS activo</Text>
          <TouchableOpacity style={styles.btnFinalizar} onPress={finalizarServicio}>
            <Text style={styles.btnFinalizarText}>Finalizar</Text>
          </TouchableOpacity>
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
                {solicitudPendiente.dueno_nombre || `User${solicitudPendiente.dueno_id}`}
              </Text>
              <Text style={styles.cardMascota}>
                Mascota : {solicitudPendiente.mascota_nombre || `#${solicitudPendiente.mascota_id}`}
              </Text>
            </View>

            {/* Lado derecho: nota + botones */}
            <View style={styles.cardRight}>
              <Text style={styles.cardNota} numberOfLines={1}>
                Nota : {solicitudPendiente.notas_dueno || solicitudPendiente.notas || "Sin notas"}
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
  activoText: { fontSize: ms(13), fontWeight: "bold", color: "#1a1a1a", flex: 1 },
  btnFinalizar: {
    backgroundColor: "#dc3545",
    borderRadius: s(8),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
  },
  btnFinalizarText: { color: "#fff", fontWeight: "bold", fontSize: ms(12) },

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
