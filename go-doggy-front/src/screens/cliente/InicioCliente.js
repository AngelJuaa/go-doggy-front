import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal } from "react-native";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { styles } from "./styles/InicioClienteStyles";
import storage from "../../utils/storage";
import { API_URL } from "../../utils/api";
import { getSocket } from "../../utils/socket";

const SERVICIO_ACTIVO_CARD_KEY = "servicio_activo_cliente_card";
const BUSQUEDA_PENDIENTE_KEY = "busqueda_paseador_pendiente";
const RESEÑA_PENDIENTE_KEY = "resena_paseador_pendiente";
const ESPERA_ENTREGA_KEY = "espera_entrega_inicial";

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
  const [entregaInicialServicioId, setEntregaInicialServicioId] = useState(null);
  const [showEntregaInicialModal, setShowEntregaInicialModal] = useState(false);
  const [pasoEntregaInicial, setPasoEntregaInicial] = useState("llegada");
  const [respuestaEntregaExpiraEn, setRespuestaEntregaExpiraEn] = useState(null);
  const [respuestaEntregaAhora, setRespuestaEntregaAhora] = useState(Date.now());
  const [esperaEntregaExpiraEn, setEsperaEntregaExpiraEn] = useState(() => {
    const valor = Number(storage.getItem(ESPERA_ENTREGA_KEY));
    return Number.isFinite(valor) && valor > Date.now() ? valor : null;
  });
  const [esperaEntregaAhora, setEsperaEntregaAhora] = useState(Date.now());
  const [noEntregaExpiraEn, setNoEntregaExpiraEn] = useState(null);
  const [noEntregaAhora, setNoEntregaAhora] = useState(Date.now());
  const [busquedaPendiente, setBusquedaPendiente] = useState(null);
  const [busquedaAhora, setBusquedaAhora] = useState(Date.now());
  const [showPaseadorCancelado, setShowPaseadorCancelado] = useState(false);
  const [mensajeCancelacion, setMensajeCancelacion] = useState("El viaje fue cancelado.");
  const socket = getSocket();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!showPaseadorCancelado) return;
    const timeoutId = setTimeout(() => {
      setShowPaseadorCancelado(false);
      navigation.reset({ index: 0, routes: [{ name: "Inicio_cliente" }] });
    }, 10000);
    return () => clearTimeout(timeoutId);
  }, [showPaseadorCancelado, navigation]);

  useEffect(() => {
    let pendiente = null;
    try {
      const guardada = storage.getItem(RESEÑA_PENDIENTE_KEY);
      pendiente = guardada ? JSON.parse(guardada) : null;
    } catch (error) {
      pendiente = null;
    }

    const mostrarResena = route?.params?.mostrarResena || Boolean(pendiente?.servicioId);
    const servicioId = route?.params?.servicioId || pendiente?.servicioId;
    if (!mostrarResena || !servicioId) return;

    storage.removeItem(RESEÑA_PENDIENTE_KEY);
    navigation.navigate("ReseñaAPaseadorDeCliente", {
      servicioId,
      paseadorId: route?.params?.paseadorId || pendiente?.paseadorId,
    });
    navigation.setParams({ mostrarResena: false });
  }, [navigation, route?.params?.mostrarResena, route?.params?.servicioId, route?.params?.paseadorId]);

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

    const inicio = servicio?.hora_inicio;
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

  const abrirMapaCliente = () => {
    const servicioId = Number(servicioActivo?.servicio_id || 0);
    navigation.navigate("MapaCliente", { servicioId: servicioId || undefined });
  };

  const confirmarEntregaMascotas = () => {
    const servicioId = Number(entregaInicialServicioId || servicioActivo?.servicio_id || 0);
    if (!servicioId) return;
    socket.emit("cliente:mascotas:entregadas", { servicioId });
    setEntregaInicialServicioId(null);
    setNoEntregaExpiraEn(null);
    navigation.navigate("MapaCliente", { servicioId });
  };

  const responderEntregaInicial = (respuesta) => {
    const servicioId = Number(entregaInicialServicioId || servicioActivo?.servicio_id || 0);
    if (!servicioId) return;
    setRespuestaEntregaExpiraEn(null);
    if (respuesta) {
      if (pasoEntregaInicial === "llegada") {
        setPasoEntregaInicial("entrega");
        setShowEntregaInicialModal(true);
      } else {
        setShowEntregaInicialModal(false);
        setEsperaEntregaExpiraEn(null);
        storage.removeItem(ESPERA_ENTREGA_KEY);
        socket.emit("cliente:mascotas:entregadas", { servicioId });
        setEntregaInicialServicioId(null);
        setNoEntregaExpiraEn(null);
        navigation.navigate("MapaCliente", { servicioId });
      }
    } else {
      setShowEntregaInicialModal(false);
      socket.emit("cliente:mascotas:no-entregadas", { servicioId });
    }
  };

  const indicarNoEntregaMascotas = () => {
    setNoEntregaExpiraEn(Date.now() + 5 * 60 * 1000);
  };

  useFocusEffect(
    useCallback(() => {
      const activeRole = storage.getItem("active_role");
      const usuarioGuardado = storage.getItem("usuario");

      if (activeRole && activeRole !== "cliente") {
        navigation.reset({
          index: 0,
          routes: [{ name: "Login", params: { tipo: "cliente" } }],
        });
        return;
      }

      const cargarMascotas = async () => {
        try {
          // Obtener usuario de storage
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

      cargarMascotas();

      setBusquedaPendiente(null);

      const restaurarBusquedaPendiente = async () => {
        const busquedaGuardada = storage.getItem(BUSQUEDA_PENDIENTE_KEY);
        if (!busquedaGuardada) return;

        try {
          const busqueda = JSON.parse(busquedaGuardada);
          const servicioId = Number(busqueda.servicioPendienteId || 0);
          if (!servicioId || !busqueda.busquedaExpiraEn || busqueda.busquedaExpiraEn <= Date.now()) {
            throw new Error("Busqueda expirada");
          }

          const servicioResponse = await fetch(`${API_URL}/servicio/${servicioId}`);
          const servicio = servicioResponse.ok ? await servicioResponse.json() : null;
          const sigueBuscando = servicio?.estado === "esperando" && !servicio?.paseador_id;
          if (sigueBuscando) {
            setBusquedaPendiente(busqueda);
          } else {
            storage.removeItem(BUSQUEDA_PENDIENTE_KEY);
          }
        } catch (e) {
          storage.removeItem(BUSQUEDA_PENDIENTE_KEY);
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
            setBusquedaPendiente(null);
            storage.removeItem(BUSQUEDA_PENDIENTE_KEY);
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
      restaurarBusquedaPendiente();
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
    const limpiarBusquedaAlAceptar = (payload) => {
      if (!Number(payload?.servicio_id || 0)) return;
      setBusquedaPendiente(null);
      storage.removeItem(BUSQUEDA_PENDIENTE_KEY);
    };

    const handleServicioFinalizado = (payload) => {
      const payloadServicioId = Number(payload?.servicio_id || payload?.servicio?.servicio_id || 0);
      const currentServicioId = Number(servicioActivo?.servicio_id || 0);
      if (payloadServicioId && currentServicioId && payloadServicioId !== currentServicioId) return;

      setServicioActivo(null);
      setPaseadorInfo(null);
      setMensajeCancelacion(payload?.mensaje_cliente || "El viaje fue cancelado.");
      setServicioSeleccionadoId(null);
      storage.removeItem(SERVICIO_ACTIVO_CARD_KEY);
    };

    socket.on("cliente:servicio:aceptado", limpiarBusquedaAlAceptar);
    socket.on("cliente:servicio:confirmar_tarifa", limpiarBusquedaAlAceptar);
    socket.on("servicio:finalizado", handleServicioFinalizado);

    return () => {
      socket.off("cliente:servicio:aceptado", limpiarBusquedaAlAceptar);
      socket.off("cliente:servicio:confirmar_tarifa", limpiarBusquedaAlAceptar);
      socket.off("servicio:finalizado", handleServicioFinalizado);
    };
  }, [socket, servicioActivo?.servicio_id]);

  useEffect(() => {
    const handleLlegadaRecogida = (payload) => {
      if (!isFocused) return;
      const servicioId = Number(payload?.servicio_id || 0);
      if (!servicioId) return;
      setNoEntregaExpiraEn(null);
      setEntregaInicialServicioId(servicioId);
      setShowEntregaInicialModal(true);
    };

    const handleSolicitudEntrega = (payload) => {
      if (!isFocused) return;
      const servicioId = Number(payload?.servicio_id || 0);
      if (!servicioId || payload?.fase !== "recogida") return;
      setEntregaInicialServicioId(servicioId);
      setPasoEntregaInicial("llegada");
      setRespuestaEntregaExpiraEn(Date.now() + 10 * 1000);
      const segundosRestantes = Number(payload?.segundos_restantes);
      if (Number.isFinite(segundosRestantes)) {
        const expiraEn = Date.now() + segundosRestantes * 1000;
        setEsperaEntregaExpiraEn(expiraEn);
        storage.setItem(ESPERA_ENTREGA_KEY, String(expiraEn));
      }
      setNoEntregaExpiraEn(null);
      setShowEntregaInicialModal(true);
    };

    const handlePorLlegar = (payload) => {
      const servicioId = Number(payload?.servicio_id || 0);
      if (!servicioId || (servicioActivo?.servicio_id && servicioId !== Number(servicioActivo.servicio_id))) return;
      Alert.alert("Paseador por llegar", "El paseador está por llegar.");
    };

    const handleServicioCancelado = (payload) => {
      const servicioId = Number(payload?.servicio_id || 0);
      if (servicioActivo?.servicio_id && servicioId !== Number(servicioActivo.servicio_id)) return;
      setEntregaInicialServicioId(null);
      setNoEntregaExpiraEn(null);
      setServicioActivo(null);
      setPaseadorInfo(null);
      setEsperaEntregaExpiraEn(null);
      storage.removeItem(ESPERA_ENTREGA_KEY);
      setBusquedaPendiente(null);
      storage.removeItem(BUSQUEDA_PENDIENTE_KEY);
      storage.removeItem(SERVICIO_ACTIVO_CARD_KEY);
      setShowPaseadorCancelado(true);
    };

    socket.on("cliente:paseador:llego-recogida", handleLlegadaRecogida);
    socket.on("cliente:entrega:solicitud", handleSolicitudEntrega);
    socket.on("cliente:paseador:por-llegar", handlePorLlegar);
    socket.on("servicio:cancelado", handleServicioCancelado);
    return () => {
      socket.off("cliente:paseador:llego-recogida", handleLlegadaRecogida);
      socket.off("cliente:entrega:solicitud", handleSolicitudEntrega);
      socket.off("cliente:paseador:por-llegar", handlePorLlegar);
      socket.off("servicio:cancelado", handleServicioCancelado);
    };
  }, [socket, servicioActivo?.servicio_id, isFocused]);

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
    if (!respuestaEntregaExpiraEn || !showEntregaInicialModal || pasoEntregaInicial !== "llegada") return;

    const actualizarRespuesta = () => {
      const ahora = Date.now();
      setRespuestaEntregaAhora(ahora);
      if (ahora < respuestaEntregaExpiraEn) return;

      setRespuestaEntregaExpiraEn(null);
      setShowEntregaInicialModal(false);
      const servicioId = Number(entregaInicialServicioId || servicioActivo?.servicio_id || 0);
      if (servicioId) socket.emit("cliente:mascotas:no-entregadas", { servicioId });
    };

    actualizarRespuesta();
    const intervalId = setInterval(actualizarRespuesta, 1000);
    return () => clearInterval(intervalId);
  }, [respuestaEntregaExpiraEn, showEntregaInicialModal, pasoEntregaInicial, entregaInicialServicioId, servicioActivo?.servicio_id, socket]);

  useEffect(() => {
    if (!noEntregaExpiraEn) return;

    const actualizar = () => {
      const ahora = Date.now();
      setNoEntregaAhora(ahora);
      if (ahora < noEntregaExpiraEn) return;

      const servicioId = Number(entregaInicialServicioId || servicioActivo?.servicio_id || 0);
      if (servicioId) {
        socket.emit("cliente:mascotas:no-entregadas:expirar", { servicioId });
      }
      setNoEntregaExpiraEn(null);
      setEntregaInicialServicioId(null);
      Alert.alert("Viaje cancelado", "Se canceló el viaje y se cobró el monto estipulado. Gracias.");
    };

    actualizar();
    const intervalId = setInterval(actualizar, 1000);
    return () => clearInterval(intervalId);
  }, [noEntregaExpiraEn, entregaInicialServicioId, servicioActivo?.servicio_id, socket]);

  useEffect(() => {
    if (!busquedaPendiente?.busquedaExpiraEn) return;
    const intervalId = setInterval(() => setBusquedaAhora(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [busquedaPendiente]);

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

      <Modal
        visible={showPaseadorCancelado}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaseadorCancelado(false)}
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
        visible={showEntregaInicialModal}
        transparent
        animationType="fade"
        onRequestClose={() => responderEntregaInicial(false)}
      >
        <View style={styles.canceladoModalOverlay}>
          <View style={styles.canceladoModalCard}>
            <Text style={styles.canceladoModalText}>
              {pasoEntregaInicial === "llegada"
                ? "El paseador ya está afuera esperándote. ¿Vas a entregar las mascotas?"
                : "¿Entregaste las mascotas al paseador?"}
              {pasoEntregaInicial === "llegada" && respuestaEntregaExpiraEn
                ? `  ${Math.max(0, Math.ceil((respuestaEntregaExpiraEn - respuestaEntregaAhora) / 1000))}s`
                : ""}
              {esperaEntregaExpiraEn
                ? `  (${Math.floor(Math.max(0, esperaEntregaExpiraEn - esperaEntregaAhora) / 60000)}:${String(Math.floor((Math.max(0, esperaEntregaExpiraEn - esperaEntregaAhora) % 60000) / 1000)).padStart(2, "0")})`
                : ""}
            </Text>
            <View style={styles.entregaModalActions}>
              <TouchableOpacity style={styles.entregaModalNoButton} onPress={() => responderEntregaInicial(false)}>
                <Text style={styles.canceladoModalButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.canceladoModalButton} onPress={() => responderEntregaInicial(true)}>
                <Text style={styles.canceladoModalButtonText}>Sí</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

        {busquedaPendiente ? (
          <View style={styles.busquedaCard}>
            <Text style={styles.busquedaTitle}>Buscando paseador...</Text>
            <Text style={styles.busquedaTimer}>
              {`${Math.floor(Math.max(0, busquedaPendiente.busquedaExpiraEn - busquedaAhora) / 60000)}:${String(Math.floor((Math.max(0, busquedaPendiente.busquedaExpiraEn - busquedaAhora) % 60000) / 1000)).padStart(2, "0")}`}
            </Text>
            <TouchableOpacity style={styles.btnCancelarBusqueda} onPress={() => {
              setBusquedaPendiente(null);
              storage.removeItem(BUSQUEDA_PENDIENTE_KEY);
            }}>
              <Text style={styles.btnCancelarText}>Cancelar búsqueda</Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
          onPress={abrirMapaCliente}
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
