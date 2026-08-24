import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, Linking, StyleSheet, Platform, Image, ScrollView } from "react-native";
import { s, vs, ms } from "../../utils/responsive";
import { API_URL } from "../../utils/api";
import storage from "../../utils/storage";

const RESEÑA_PENDIENTE_KEY = "resena_paseador_pendiente";

const buildMercadoPagoUrl = ({ servicioId, tarifa_base_hora, tipo_servicio, duracion_minutos }) => {
  const monto = Number(tarifa_base_hora);
  const params = new URLSearchParams();
  if (Number.isFinite(monto)) params.append("amount", monto.toFixed(2));
  if (servicioId) params.append("servicioId", String(servicioId));
  if (tipo_servicio) params.append("tipo_servicio", String(tipo_servicio));
  if (duracion_minutos) params.append("duracion_minutos", String(duracion_minutos));
  return `https://www.mercadopago.com.mx/checkout?${params.toString()}`;
};

export default function PagoMercadoPago({ route, navigation }) {
  const {
    servicioId: servicioIdParam,
    servicio_id,
    paseadorId,
    tarifa_base_hora,
    tipo_servicio,
    duracion_minutos,
    notas_dueno,
    tipoCobro,
    distanciaMetros,
    montoAdicional,
  } = route?.params || {};
  const servicioId = Number(servicioIdParam || servicio_id || 0) || null;
  const esSegundoCobro = tipoCobro === "distancia";
  const tarifa = Number(tarifa_base_hora);
  const formattedTarifa = Number.isFinite(tarifa) ? tarifa.toFixed(2) : tarifa_base_hora;
  const mercadoPagoUrl = buildMercadoPagoUrl({ servicioId, tarifa_base_hora, tipo_servicio, duracion_minutos });
  const [loading, setLoading] = useState(false);
  const [openingPayment, setOpeningPayment] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null);

  const goToMapaCliente = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "MapaCliente", params: { servicioId } }],
    });
  };

  const goToInicioCliente = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "ReseñaAPaseadorDeCliente", params: { servicioId, paseadorId: route?.params?.paseadorId } }],
    });
  };

  const openMercadoPago = async ({ fromUserAction = false } = {}) => {
    if (!mercadoPagoUrl || openingPayment) return;

    setOpeningPayment(true);
    try {
      if (Platform.OS === "web") {
        // En web, abrir en nueva pestaña solo cuando viene de interacción del usuario.
        if (fromUserAction) {
          const popup = window.open(mercadoPagoUrl, "_blank", "noopener,noreferrer");
          if (!popup) {
            window.location.assign(mercadoPagoUrl);
          }
        }
        return;
      }

      const supported = await Linking.canOpenURL(mercadoPagoUrl);
      if (!supported) throw new Error("URL no soportada");
      await Linking.openURL(mercadoPagoUrl);
    } catch (error) {
      console.error("Error abriendo Mercado Pago:", error);
      Alert.alert("Error", "No se pudo abrir Mercado Pago. Intenta de nuevo más tarde.");
    } finally {
      setOpeningPayment(false);
    }
  };

  const confirmarPagoYVolver = async () => {
    if (!servicioId) {
      Alert.alert("Servicio inválido", "No se encontró el ID del servicio.");
      return;
    }

    setLoading(true);
    try {
      if (esSegundoCobro) {
        storage.setItem(RESEÑA_PENDIENTE_KEY, JSON.stringify({
          servicioId,
          paseadorId: route?.params?.paseadorId || null,
        }));
        Alert.alert("Pago confirmado", "El paseo ha concluido, gracias por su preferencia.");
        goToInicioCliente();
        return;
      }

      const response = await fetch(`${API_URL}/servicio/${servicioId}/iniciar`, {
        method: "PUT",
      });
      if (!response.ok) {
        let backendMessage = "";
        try {
          const data = await response.json();
          backendMessage = data?.message || "";
        } catch (e) {
          backendMessage = "";
        }

        const alreadyStarted = response.status === 404 && backendMessage.toLowerCase().includes("pendiente");
        if (alreadyStarted) {
          Alert.alert("Servicio en curso", "El servicio ya fue confirmado. Regresando al mapa.");
          goToMapaCliente();
          return;
        }

        throw new Error(backendMessage || "Error iniciando servicio");
      }
      Alert.alert("Pago confirmado", "El paseo se ha iniciado. Regresando al mapa.");
      // Navegar de vuelta al mapa con el servicio activo
      goToMapaCliente();
    } catch (error) {
      console.error("Error iniciando el servicio:", error);
      Alert.alert("Error", "No se pudo confirmar el pago. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // En móvil abrimos automáticamente; en web esperamos al click para evitar bloqueo de popup.
    if (Platform.OS !== "web") {
      openMercadoPago();
    }
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.topRightShortcut}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.topRightShortcutText}>←</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Pago con Mercado Pago</Text>
        <Text style={styles.subtitle}>{esSegundoCobro ? "Cobro final del paseo" : "Monto a pagar"}</Text>
        <Text style={styles.amount}>${formattedTarifa || "0.00"}</Text>
        <Text style={styles.details}>Servicio: {tipo_servicio || "Paseo"}</Text>
        {esSegundoCobro ? (
          <Text style={styles.details}>Distancia recorrida: {Number(distanciaMetros || 0)} metros</Text>
        ) : (
          <Text style={styles.details}>Duración: {duracion_minutos ? `${duracion_minutos} minutos` : "N/A"}</Text>
        )}
        {esSegundoCobro ? <Text style={styles.details}>Monto por distancia: ${Number(montoAdicional || 0).toFixed(2)}</Text> : null}
        {notas_dueno ? <Text style={styles.details}>Notas: {notas_dueno}</Text> : null}

        <TouchableOpacity
          style={styles.button}
          onPress={() => openMercadoPago({ fromUserAction: true })}
          disabled={openingPayment}
        >
          <Text style={styles.buttonText}>Ir a Mercado Pago</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={confirmarPagoYVolver} disabled={loading}>
          <Text style={styles.secondaryButtonText}>{loading ? "Confirmando pago..." : "Terminé el pago, continuar"}</Text>
        </TouchableOpacity>
        <Text style={styles.notice}>
          {Platform.OS === "web"
            ? "Cuando regreses de Mercado Pago, presiona 'Volver y confirmar pago'."
            : "Cuando regreses de Mercado Pago, presiona 'Volver y confirmar pago'."}
        </Text>

        <Text style={styles.notice}>
          {Platform.OS === "web"
            ? "Se abrirá una nueva pestaña para completar el pago."
            : "Se abrirá la aplicación de Mercado Pago o el navegador para pagar."}
        </Text>
      </ScrollView>

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
          <Image source={require("../../../assets/Notificaciones.png")} style={styles.tabIconImg} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    padding: s(20),
    paddingBottom: vs(100),
    paddingTop: vs(68),
    justifyContent: "center",
    flexGrow: 1,
  },
  topRightShortcut: {
    position: "absolute",
    top: vs(20),
    right: s(12),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#99D9C1",
    borderRadius: s(16),
    paddingHorizontal: s(12),
    paddingVertical: vs(7),
    zIndex: 10,
  },
  topRightShortcutText: {
    color: "#0A7A4A",
    fontSize: ms(12),
    fontWeight: "700",
  },
  title: {
    fontSize: ms(24),
    fontWeight: "bold",
    marginBottom: vs(12),
    textAlign: "center",
  },
  subtitle: {
    fontSize: ms(16),
    color: "#6B7280",
    textAlign: "center",
    marginBottom: vs(6),
  },
  amount: {
    fontSize: ms(34),
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: vs(20),
  },
  details: {
    fontSize: ms(14),
    color: "#374151",
    textAlign: "center",
    marginBottom: vs(6),
  },
  button: {
    marginTop: vs(24),
    backgroundColor: "#009FE3",
    paddingVertical: vs(14),
    borderRadius: s(14),
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: ms(16),
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: vs(12),
    borderColor: "#374151",
    borderWidth: 1,
    paddingVertical: vs(12),
    borderRadius: s(14),
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: ms(15),
    fontWeight: "600",
  },
  notice: {
    marginTop: vs(16),
    color: "#6B7280",
    fontSize: ms(13),
    textAlign: "center",
    lineHeight: ms(20),
  },
  bottomTab: {
    flexDirection: "row",
    backgroundColor: "#99D9C1",
    height: vs(65),
    position: "absolute",
    bottom: 0,
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabIconImg: { width: s(38), height: s(38), resizeMode: "contain" },
  tabItem: { alignItems: "center", justifyContent: "center" },
  tabLabel: { fontSize: ms(11), fontWeight: "bold", color: "#333", marginBottom: vs(4) },
});
