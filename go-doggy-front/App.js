import React, { useEffect, useRef, useState } from "react";
import { Alert, Linking, Platform, StyleSheet, View } from "react-native";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import WelcomePregunta from "./src/screens/welcome/WelcomePregunta";
import Welcome from "./src/screens/welcome/Welcome";
import Login from "./src/screens/auth/Login";
import RegistroUsuario from "./src/screens/auth/RegistroUsuario";
import RegistroPaseador from "./src/screens/auth/RegistroPaseador";
import InicioCliente from "./src/screens/cliente/InicioCliente";
import InicioPaseador from "./src/screens/walker/InicioPaseador";

import ServicioClienteInicio from "./src/screens/cliente/servicios/inicio/ServicioClienteInicio";
import ServicioClienteComida from "./src/screens/cliente/servicios/comida/ServicioClienteComida";
import ServicioClienteEstetica from "./src/screens/cliente/servicios/estetica/ServicioClienteEstetica";
import ServicioClienteAccesorios from "./src/screens/cliente/servicios/accesorios/ServicioClienteAccesorios";
import ServicioClientePromociones from "./src/screens/cliente/servicios/promociones/ServicioClientePromociones";
import ServicioClienteOfertas from "./src/screens/cliente/servicios/ofertas/ServicioClienteOfertas";
import ServicioClientePaseador from "./src/screens/cliente/servicios/paseador/ServicioClientePaseador";
import ServicioPaseadorDetalles from "./src/screens/detalles_servicios/paseador/ServicioPaseadorDetalles";
import ServicioComidaDetalles from "./src/screens/detalles_servicios/comida/ServicioComidaDetalles";
import ServicioEsteticaDetalles from "./src/screens/detalles_servicios/estetica/ServicioEsteticaDetalles";
import ServicioAccesoriosDetalles from "./src/screens/detalles_servicios/accesorios/ServicioAccesoriosDetalles";
import ServicioPromocionesDetalles from "./src/screens/detalles_servicios/promociones/ServicioPromocionesDetalles";
import ServicioOfertasDetalles from "./src/screens/detalles_servicios/ofertas/ServicioOfertasDetalles";

import PerfilUsuario from "./src/screens/user/PerfilUsuario";
import EditarPerfilUsuario from "./src/screens/user/EditarPerfilUsuario";
import EditarMascota from "./src/screens/pets/EditarMascota";
import RegistroMascota from "./src/screens/pets/RegistroMascota";
import CalificacionesUsuario from "./src/screens/user/CalificacionesUsuario";
import ConfiguracionUsuario from "./src/screens/user/ConfiguracionUsuario";
import LegalUsuario from "./src/screens/user/LegalUsuario";
import SeguridadUsuario from "./src/screens/user/SeguridadUsuario";
import MascotaDetalles from "./src/screens/pets/MascotaDetalles";
import PeticionPaseo from "./src/screens/cliente/PeticionPaseo";
import MapaCliente from "./src/screens/cliente/MapaCliente";
import PagoMercadoPago from "./src/screens/cliente/PagoMercadoPago";
import MetodoPagoCliente from "./src/screens/cliente/MetodoPagoCliente";
import AgregarDireccionCliente from "./src/screens/cliente/agregarDireccionCliente";
import VerDireccionClienteDetalles from "./src/screens/cliente/verDireccionClienteDetalles";
import EditarDireccionClienteDetalles from "./src/screens/cliente/editarDireccionClienteDetalles";
import MapaPaseador from "./src/screens/walker/MapaPaseador";
import GananciasPaseador from "./src/screens/walker/GananciasPaseador";
import GananciasDetalle  from "./src/screens/walker/stats/GananciasDetalle";
import ConectadoDetalle  from "./src/screens/walker/stats/ConectadoDetalle";
import PaseosDetalle     from "./src/screens/walker/stats/PaseosDetalle";
import EstrellasDetalle  from "./src/screens/walker/stats/EstrellasDetalle";
import PaseosPaseador from "./src/screens/walker/PaseosPaseador";
import PerfilPaseador from "./src/screens/walker/PerfilPaseador";
import RutaPaseo from "./src/screens/walker/RutaPaseo";
import VerReciboPaseador from "./src/screens/walker/VerReciboPaseador";
import VerPerfilPaseador from "./src/screens/walker/VerPerfilPaseador";
import EditarPerfilPaseador from "./src/screens/walker/EditarPerfilPaseador";
import NotificacionesPaseador from "./src/screens/user/NotificacionesPaseador";
import NotificacionesCliente from "./src/screens/cliente/notificaciones/NotificacionesCliente";
import NotificacionDetalle from "./src/screens/user/NotificacionDetalle";
import BilleteraUsuario from "./src/screens/user/BilleteraUsuario";
import AyudaUsuario from "./src/screens/user/AyudaUsuario";
import { apiFetch } from "./src/utils/api";
import storage from "./src/utils/storage";
import { getSocket } from "./src/utils/socket";

const Stack = createStackNavigator();
const navigationRef = createNavigationContainerRef();

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    ...(Platform.OS === "web"
      ? {
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
          minHeight: "100vh",
        }
      : {}),
  },
});

export default function App() {
  const paymentOpenedRef = useRef({ servicioId: null, opened: false });
  const [authRole, setAuthRole] = useState(null);
  const [authUser, setAuthUser] = useState(null);

  const refreshAuth = () => {
    let usuario = null;
    let role = null;
    try {
      const paseador = JSON.parse(storage.getItem("paseador") || "null");
      const cliente = JSON.parse(storage.getItem("usuario") || "null");
      const activeRole = storage.getItem("active_role");

      if (activeRole === "cliente" && cliente?.usuario_id) {
        usuario = cliente;
        role = "cliente";
      } else if (activeRole === "paseador" && paseador?.paseador_id) {
        usuario = paseador;
        role = "paseador";
      } else if (paseador?.paseador_id) {
        usuario = paseador;
        role = "paseador";
      } else if (cliente?.usuario_id) {
        usuario = cliente;
        role = "cliente";
      }
    } catch (error) {
      usuario = null;
      role = null;
    }

    setAuthUser((current) => {
      if (current?.usuario_id === usuario?.usuario_id && current?.paseador_id === usuario?.paseador_id) {
        return current;
      }
      return usuario;
    });
    setAuthRole((current) => (current === role ? current : role));
  };

  useEffect(() => {
    refreshAuth();
    storage.subscribe("usuario", refreshAuth);
    storage.subscribe("paseador", refreshAuth);
    return () => {
      storage.unsubscribe("usuario", refreshAuth);
      storage.unsubscribe("paseador", refreshAuth);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") {
      const html = document.documentElement;
      const body = document.body;
      const root = document.getElementById("root");

      [html, body, root].forEach((node) => {
        if (node) {
          node.style.setProperty("height", "100%");
          node.style.setProperty("minHeight", "100vh");
          node.style.setProperty("overflow", "auto");
          node.style.setProperty("overscrollBehavior", "auto");
        }
      });
    }

    const socket = getSocket();

    let clienteSesion = null;
    try {
      clienteSesion = JSON.parse(storage.getItem("usuario") || "null");
    } catch (error) {
      clienteSesion = null;
    }

    const clienteId = Number(clienteSesion?.usuario_id || 0);

    const activeRole = storage.getItem("active_role");
    const shouldHandleClienteFlow = (activeRole === "cliente" || authRole === "cliente") && clienteId > 0;

    if (shouldHandleClienteFlow) {
      socket.emit("cliente:online", { clienteId });
    } else if (authRole === "paseador" && authUser?.paseador_id) {
      socket.emit("paseador:online", { paseadorId: authUser.paseador_id });
    }

    const openMetodoPagoScreen = (params) => {
      if (!params?.servicioId) return;
      if (
        paymentOpenedRef.current.opened &&
        paymentOpenedRef.current.servicioId === params.servicioId
      ) {
        return;
      }

      const navigate = () => {
        if (!navigationRef.isReady()) {
          setTimeout(navigate, 100);
          return;
        }

        paymentOpenedRef.current = { servicioId: params.servicioId, opened: true };
        navigationRef.navigate("MetodoPagoCliente", params);
      };

      navigate();
    };

    const onServicioAceptado = async (payload) => {
      const servicioId = Number(payload?.servicio_id);
      if (!servicioId) return;
      if (!shouldHandleClienteFlow) return;
      if (clienteId && Number(payload?.dueno_id || 0) && Number(payload?.dueno_id) !== clienteId) return;

      const estado = String(payload?.estado || "").toLowerCase();
      if (estado === "en_camino" || estado === "activo") {
        if (navigationRef.isReady()) {
          navigationRef.navigate("MapaCliente", { servicioId });
        }
        return;
      }

      if (estado !== "confirmar_precio") return;

      Alert.alert(
        "¡Paseador aceptó tu solicitud!",
        "Selecciona un método de pago para continuar.",
      );

      try {
        const servicio = await apiFetch(`/servicio/${servicioId}`);
        openMetodoPagoScreen({
          servicioId,
          tarifa_base_hora: Number(servicio.tarifa_base_hora),
          tipo_servicio: servicio.tipo_servicio,
          duracion_minutos: servicio.duracion_minutos,
          notas_dueno: servicio.notas_dueno,
        });
      } catch (e) {
        console.warn("No se obtuvieron detalles del servicio para método de pago:", e.message || e);
        openMetodoPagoScreen({ servicioId });
      }
    };

    const onConfirmarTarifa = async (payload) => {
      const servicioId = Number(payload?.servicio_id);
      if (!servicioId) return;
      if (!shouldHandleClienteFlow) return;
      if (clienteId && Number(payload?.dueno_id || 0) && Number(payload?.dueno_id) !== clienteId) return;

      const tarifa = Number(payload?.tarifa_base_hora);
      let tarifaFinal = tarifa;
      let tipoServicio = payload?.tipo_servicio;
      let duracionMinutos = payload?.duracion_minutos;
      let notasDueno = payload?.notas_dueno;

      if (!Number.isFinite(tarifaFinal)) {
        try {
          const servicio = await apiFetch(`/servicio/${servicioId}`);
          tarifaFinal = Number(servicio.tarifa_base_hora);
          tipoServicio = servicio.tipo_servicio;
          duracionMinutos = servicio.duracion_minutos;
          notasDueno = servicio.notas_dueno;
        } catch (e) {
          console.warn("No se pudo completar tarifa para método de pago:", e.message || e);
        }
      }

      const formattedTarifa = Number.isFinite(tarifaFinal)
        ? tarifaFinal.toFixed(2)
        : (payload?.tarifa_base_hora ?? "0.00");
      openMetodoPagoScreen({
        servicioId,
        tarifa_base_hora: tarifaFinal,
        tipo_servicio: tipoServicio,
        duracion_minutos: duracionMinutos,
        notas_dueno: notasDueno,
      });

      Alert.alert(
        "Selecciona método de pago",
        `El paseador aceptó tu solicitud. Debes pagar MX$${formattedTarifa} para continuar.`,
      );
    };

    if (shouldHandleClienteFlow) {
      socket.on("cliente:servicio:aceptado", onServicioAceptado);
      socket.on("cliente:servicio:confirmar_tarifa", onConfirmarTarifa);
    }

    return () => {
      if (shouldHandleClienteFlow) {
        socket.off("cliente:servicio:aceptado", onServicioAceptado);
        socket.off("cliente:servicio:confirmar_tarifa", onConfirmarTarifa);
      }
    };
  }, [authRole, authUser]);

  return (
    <GestureHandlerRootView style={styles.appShell}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="WelcomePregunta"
          screenOptions={{ headerShown: false }}
        >
        <Stack.Screen name="WelcomePregunta" component={WelcomePregunta} />
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="RegistroUsuario" component={RegistroUsuario} />
        <Stack.Screen name="RegistroPaseador" component={RegistroPaseador} />
        <Stack.Screen name="Inicio_cliente" component={InicioCliente} />
        <Stack.Screen name="InicioPaseador" component={InicioPaseador} />
        <Stack.Screen
          name="Servicio_Cliente_Inicio"
          component={ServicioClienteInicio}
        />
        <Stack.Screen
          name="Servicio_Cliente_Comida"
          component={ServicioClienteComida}
        />
        <Stack.Screen
          name="Servicio_Cliente_Estetica"
          component={ServicioClienteEstetica}
        />
        <Stack.Screen
          name="Servicio_Cliente_Accesorios"
          component={ServicioClienteAccesorios}
        />
        <Stack.Screen
          name="Servicio_Cliente_Promociones"
          component={ServicioClientePromociones}
        />
        <Stack.Screen
          name="Servicio_Cliente_Ofertas"
          component={ServicioClienteOfertas}
        />
        <Stack.Screen
          name="Servicio_Cliente_Paseador"
          component={ServicioClientePaseador}
        />
        <Stack.Screen
          name="Servicio_Detalles_Paseador"
          component={ServicioPaseadorDetalles}
        />
        <Stack.Screen
          name="Servicio_Detalles_Comida"
          component={ServicioComidaDetalles}
        />
        <Stack.Screen
          name="Servicio_Detalles_Estetica"
          component={ServicioEsteticaDetalles}
        />
        <Stack.Screen
          name="Servicio_Detalles_Accesorios"
          component={ServicioAccesoriosDetalles}
        />
        <Stack.Screen
          name="Servicio_Detalles_Promociones"
          component={ServicioPromocionesDetalles}
        />
        <Stack.Screen
          name="Servicio_Detalles_Ofertas"
          component={ServicioOfertasDetalles}
        />
        <Stack.Screen name="PerfilUsuario" component={PerfilUsuario} />
        <Stack.Screen
          name="EditarPerfilUsuario"
          component={EditarPerfilUsuario}
        />
        <Stack.Screen name="EditarMascota" component={EditarMascota} />
        <Stack.Screen name="RegistroMascota" component={RegistroMascota} />
        <Stack.Screen name="Calificaciones" component={CalificacionesUsuario} />
        <Stack.Screen
          name="ConfiguracionUsuario"
          component={ConfiguracionUsuario}
        />
        <Stack.Screen name="LegalUsuario" component={LegalUsuario} />
        <Stack.Screen name="SeguridadUsuario" component={SeguridadUsuario} />
        <Stack.Screen name="MascotaDetalles" component={MascotaDetalles} />
        <Stack.Screen name="PeticionPaseo" component={PeticionPaseo} />
        <Stack.Screen name="MapaCliente" component={MapaCliente} />
        <Stack.Screen name="MercadoPago" component={PagoMercadoPago} />
        <Stack.Screen name="MetodoPagoCliente" component={MetodoPagoCliente} />
        <Stack.Screen name="AgregarDireccionCliente" component={AgregarDireccionCliente} />
        <Stack.Screen name="verDireccionClienteDetalles" component={VerDireccionClienteDetalles} />
        <Stack.Screen name="editarDireccionClienteDetalles" component={EditarDireccionClienteDetalles} />
        <Stack.Screen name="MapaPaseador" component={MapaPaseador} />
        <Stack.Screen name="GananciasPaseador"  component={GananciasPaseador} />
        <Stack.Screen name="GananciasDetalle"   component={GananciasDetalle} />
        <Stack.Screen name="ConectadoDetalle"   component={ConectadoDetalle} />
        <Stack.Screen name="PaseosDetalle"      component={PaseosDetalle} />
        <Stack.Screen name="EstrellasDetalle"   component={EstrellasDetalle} />
        <Stack.Screen name="PaseosPaseador" component={PaseosPaseador} />
        <Stack.Screen name="PerfilPaseador" component={PerfilPaseador} />
        <Stack.Screen name="VerPerfilPaseador" component={VerPerfilPaseador} />
        <Stack.Screen name="EditarPerfilPaseador" component={EditarPerfilPaseador} />
        <Stack.Screen name="RutaPaseo" component={RutaPaseo} />
        <Stack.Screen name="VerReciboPaseador" component={VerReciboPaseador} />
        <Stack.Screen name="NotificacionesCliente" component={NotificacionesCliente} />
        <Stack.Screen name="NotificacionesPaseador" component={NotificacionesPaseador} />
        <Stack.Screen name="NotificacionDetalle" component={NotificacionDetalle} />
        <Stack.Screen name="BilleteraUsuario" component={BilleteraUsuario} />
          <Stack.Screen name="AyudaUsuario" component={AyudaUsuario} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
