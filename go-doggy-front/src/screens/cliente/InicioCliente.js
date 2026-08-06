import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { styles } from "./styles/InicioClienteStyles";
import storage from "../../utils/storage";
import { API_URL } from "../../utils/api";
import { getSocket } from "../../utils/socket";

const SERVICIO_ACTIVO_CARD_KEY = "servicio_activo_cliente_card";

export default function Inicio_cliente({ route, navigation }) {
  // ========================
  // ESTADOS
  // ========================
  const [mascotas, setMascotas] = useState([]);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [paseadorInfo, setPaseadorInfo] = useState(null);
  const [servicioActivo, setServicioActivo] = useState(null);
  const [servicioSeleccionadoId, setServicioSeleccionadoId] = useState(null);
  const [loadingPaseador, setLoadingPaseador] = useState(false);
  const socket = getSocket();

  // ========================
  // FUNCIONES
  // ========================
  const irPerfil = () => navigation.navigate("PerfilUsuario");
  const regresar = () => navigation.goBack();
  const irRegistroMascota = () => navigation.navigate("RegistroMascota");

  const esServicioFinalizado = (servicio) => {
    const estado = String(servicio?.estado || "").toLowerCase();
    return estado === "finalizado" || estado === "completado";
  };

  const esServicioVencido = (servicio) => {
    if (!servicio) return false;
    const estado = String(servicio?.estado || "").toLowerCase();
    if (!["en_camino", "activo"].includes(estado)) return false;

    const inicio = servicio?.hora_inicio || servicio?.hora_solicitada;
    const inicioTs = inicio ? new Date(inicio).getTime() : NaN;
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

  const abrirSeguimientoPaseador = () => {
    const servicioId = Number(servicioActivo?.servicio_id || 0);
    if (!servicioId) return;

    setServicioSeleccionadoId(servicioId);
    storage.setItem(
      SERVICIO_ACTIVO_CARD_KEY,
      JSON.stringify({ servicio_id: servicioId, estado: servicioActivo?.estado || "" })
    );
    navigation.navigate("MapaCliente", { servicioId });
  };

  useFocusEffect(
    useCallback(() => {
      const cargarMascotas = async () => {
        try {
          // Obtener usuario de storage
          const usuarioGuardado = storage.getItem("usuario");
          if (!usuarioGuardado) {
            console.error("No hay usuario guardado en storage");
            setMascotas([]);
            return;
          }

          const usuario = JSON.parse(usuarioGuardado);
          const usuarioId = usuario.usuario_id;

          console.log("Cargando mascotas para usuario ID:", usuarioId);

          const response = await fetch(
            `${API_URL}/mascotas/${usuarioId}`,
          );
          const data = await response.json();
          console.log("Mascotas cargadas:", data);
          setMascotas(data);
        } catch (error) {
          console.error("Error cargando mascotas:", error);
          setMascotas([]);
        }
      };

      const cargarPaseadorActivo = async () => {
        try {
          const usuarioGuardado = storage.getItem("usuario");
          if (!usuarioGuardado) {
            setPaseadorInfo(null);
            setServicioActivo(null);
            return;
          }

          const usuario = JSON.parse(usuarioGuardado);
          const usuarioId = usuario.usuario_id;

          setLoadingPaseador(true);
          const response = await fetch(`${API_URL}/servicios/dueno/${usuarioId}/paseador-activo`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "No se pudo cargar paseador");
          }

          let servicio = data.servicio || null;

          if (servicio?.servicio_id) {
            try {
              const detalleResponse = await fetch(`${API_URL}/servicio/${servicio.servicio_id}`);
              if (detalleResponse.ok) {
                const detalleServicio = await detalleResponse.json();
                if (detalleServicio && typeof detalleServicio === "object") {
                  servicio = { ...servicio, ...detalleServicio };
                }
              }
            } catch (error) {
              // Si falla el detalle, continuamos con el resumen para no romper pantalla.
            }
          }

          const ocultarCard = esServicioFinalizado(servicio) || esServicioVencido(servicio);
          const paseador = ocultarCard
            ? null
            : data.paseador || null;

          if (servicio && !ocultarCard) {
            storage.setItem(
              SERVICIO_ACTIVO_CARD_KEY,
              JSON.stringify({
                servicio_id: Number(servicio.servicio_id),
                estado: servicio.estado || "",
              })
            );
          } else {
            storage.removeItem(SERVICIO_ACTIVO_CARD_KEY);
          }

          setPaseadorInfo(paseador);
          setServicioActivo(ocultarCard ? null : servicio);
        } catch (error) {
          console.error("Error cargando paseador activo:", error);
          setPaseadorInfo(null);
          setServicioActivo(null);
        } finally {
          setLoadingPaseador(false);
        }
      };

      cargarMascotas();
      cargarPaseadorActivo();
    }, []),
  );

  useEffect(() => {
    try {
      const usuario = JSON.parse(storage.getItem("usuario") || "{}");
      if (usuario?.usuario_id) {
        socket.emit("cliente:online", { clienteId: usuario.usuario_id });
      }
    } catch (error) {
      // no-op
    }
  }, [socket]);

  useEffect(() => {
    const handleServicioFinalizado = (payload) => {
      const payloadServicioId = Number(payload?.servicio_id || payload?.servicio?.servicio_id || 0);
      const currentServicioId = Number(servicioActivo?.servicio_id || 0);
      if (payloadServicioId && currentServicioId && payloadServicioId !== currentServicioId) return;

      setServicioActivo(null);
      setPaseadorInfo(null);
      setServicioSeleccionadoId(null);
      storage.removeItem(SERVICIO_ACTIVO_CARD_KEY);
    };

    socket.on("servicio:finalizado", handleServicioFinalizado);

    return () => {
      socket.off("servicio:finalizado", handleServicioFinalizado);
    };
  }, [socket, servicioActivo?.servicio_id]);

  useEffect(() => {
    console.log("Estado mascotas:", mascotas);
  }, [mascotas]);

  // ========================
  // UI
  // ========================
  return (
    <View style={styles.container}>
      {/* NAVBAR */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={irPerfil}>
          <Text style={styles.navIcon}>☰</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={regresar}>
          <Text style={styles.navIcon}>↩</Text>
        </TouchableOpacity>
      </View>

      {/* TÍTULO */}
      <Text style={styles.titleText}>Mis mascotas</Text>

      {/* CONTENIDO */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {mascotas.length === 0 ? (
          <View style={{ padding: 30, alignItems: "center" }}>
            <Text style={{ color: "#555" }}>
              No tienes mascotas registradas aún.
            </Text>
            <Text style={{ color: "#555" }}>Usa + para crear una nueva.</Text>
          </View>
        ) : (
          mascotas.map((mascota, index) => (
            <TouchableOpacity
              key={`${mascota.nombre}-${index}`}
              style={styles.petCard}
              onPress={() =>
                navigation.navigate("MascotaDetalles", { mascota })
              }
            >
              <Image
                source={
                  mascota.url_foto
                    ? {
                        uri: `${API_URL}/uploads/${mascota.url_foto}`,
                      }
                    : require("../../../assets/perro1.jpg")
                }
                style={styles.petImage}
                resizeMode="cover"
              />
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{mascota.nombre}</Text>
                <Text style={styles.petDetails}>
                  Animal: {mascota.tipo_mascota || mascota.tipoMascota || mascota.raza}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* BOTÓN BUSCAR */}
        <TouchableOpacity
          style={styles.searchCircle}
          onPress={() => navigation.navigate("PeticionPaseo")}
        >
          <Text style={styles.searchText}>Buscar paseador</Text>
        </TouchableOpacity>

        {/* BOTÓN AGREGAR */}
        <TouchableOpacity style={styles.addButton} onPress={irRegistroMascota}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
        <Text style={styles.addHintText}>Agregar nueva mascota</Text>

        {(loadingPaseador || (paseadorInfo && servicioActivo && !esServicioFinalizado(servicioActivo))) && (
          <TouchableOpacity
            style={[
              styles.paseadorCard,
              servicioSeleccionadoId && Number(servicioActivo?.servicio_id) === Number(servicioSeleccionadoId)
                ? styles.paseadorCardSelected
                : null,
            ]}
            onPress={abrirSeguimientoPaseador}
            activeOpacity={0.9}
            disabled={!servicioActivo?.servicio_id}
          >
            <Text style={styles.paseadorCardTitle}>Tu paseador</Text>

            {loadingPaseador ? (
              <View style={styles.paseadorLoadingRow}>
                <ActivityIndicator size="small" color="#5b8f7f" />
                <Text style={styles.paseadorEmptyText}>Cargando informacion del paseador...</Text>
              </View>
            ) : paseadorInfo ? (
              <View style={styles.paseadorContentRow}>
                <Image
                  source={
                    paseadorInfo.url_foto_perfil
                      ? { uri: `${API_URL}/uploads/${paseadorInfo.url_foto_perfil}` }
                      : require("../../../assets/perro1.jpg")
                  }
                  style={styles.paseadorPhoto}
                />

                <View style={styles.paseadorTextWrap}>
                  <Text style={styles.paseadorNombre}>
                    {`${paseadorInfo.nombre || "Paseador"}${paseadorInfo.apellido ? ` ${paseadorInfo.apellido}` : ""}`}
                  </Text>
                  <Text style={styles.paseadorDescripcion} numberOfLines={3}>
                    {paseadorInfo.biografia || "Sin descripcion disponible."}
                  </Text>
                  {servicioActivo?.estado ? (
                    <Text style={styles.paseadorEstado}>Estado del servicio: {servicioActivo.estado}</Text>
                  ) : null}
                  <Text style={styles.paseadorTapHint}>Toca para ver el mapa en vivo</Text>
                </View>
              </View>
            ) : null}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* BARRA INFERIOR */}
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
          <Image
            source={require("../../../assets/casa.png")}
            style={styles.tabIconImg}
          />
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
          <Image
            source={require("../../../assets/puntos.png")}
            style={styles.tabIconImg}
          />
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
          <Image
            source={require("../../../assets/maps.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(3)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(3)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("NotificacionesCliente")}
        >
          {hoveredTab === 3 && (
            <Text style={styles.tabLabel}>Notificaciones</Text>
          )}
          <Image
            source={require("../../../assets/Notificaciones.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
