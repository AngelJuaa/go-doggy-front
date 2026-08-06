import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView, Image } from "react-native";
import styles from "./MetodoPagoClienteStyle";
import { API_URL } from "../../utils/api";

export default function MetodoPagoCliente({ route, navigation }) {
  const {
    servicioId: servicioIdParam,
    servicio_id,
    tarifa_base_hora,
    tipo_servicio,
    duracion_minutos,
    notas_dueno,
  } = route?.params || {};
  const servicioId = Number(servicioIdParam || servicio_id || 0) || null;
  const [metodo, setMetodo] = useState("mercado");
  const [loading, setLoading] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null);

  const amount = useMemo(() => {
    const tarifa = Number(tarifa_base_hora);
    if (!Number.isFinite(tarifa)) return 0;
    return Number(tarifa.toFixed(2));
  }, [tarifa_base_hora]);

  const formattedAmount = Number.isFinite(amount) ? amount.toFixed(2) : "0.00";

  const goToMapaCliente = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "MapaCliente", params: { servicioId } }],
    });
  };

  const iniciarServicio = async () => {
    if (!servicioId) {
      Alert.alert("Servicio inválido", "No se encontró el ID del servicio.");
      return;
    }

    setLoading(true);
    try {
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
          Alert.alert("Servicio en curso", "El servicio ya fue confirmado. Te llevamos al mapa.");
          goToMapaCliente();
          return;
        }

        throw new Error(backendMessage || "No se pudo iniciar el servicio");
      }

      Alert.alert("Pago confirmado", "El paseador iniciará el recorrido ahora.");
      goToMapaCliente();
    } catch (error) {
      console.error("Error confirmando pago:", error);
      Alert.alert("Error", "No se pudo confirmar el pago. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const onConfirmar = () => {
    if (loading) return;

    if (metodo === "mercado") {
      navigation.navigate("MercadoPago", { servicioId, tarifa_base_hora, tipo_servicio, duracion_minutos, notas_dueno });
      return;
    }

    iniciarServicio();
  };

  const methods = [
    { key: "tarjeta", title: "Tarjeta de débito o crédito", subtitle: "VISA, Mastercard" },
    { key: "mercado", title: "Mercado Pago", subtitle: "Pago seguro con app o navegador" },
    { key: "didi", title: "DiDi", subtitle: "Paga Después" },
    { key: "paypal", title: "PayPal", subtitle: "Cuenta PayPal o tarjeta" },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.topRightShortcut}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.topRightShortcutText}>←</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Confirmación de pago</Text>
        <Text style={styles.subtitle}>Selecciona un método para continuar con tu paseo</Text>

        <View style={styles.greenCard}>
          <Text style={styles.sectionTitle}>Método de pago</Text>

          {methods.map((item) => {
            const selected = metodo === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.optionRow, selected && styles.optionRowSelected]}
                onPress={() => setMetodo(item.key)}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>

                <View style={styles.optionContent}>
                  <Text style={styles.optionLabel}>{item.title}</Text>
                  <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Confirmación de pago</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Servicio</Text>
              <Text style={styles.summaryValue}>{tipo_servicio || "Paseo"}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duración</Text>
              <Text style={styles.summaryValue}>{duracion_minutos ? `${duracion_minutos} min` : "N/A"}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>MX${formattedAmount}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={onConfirmar} disabled={loading}>
            <Text style={styles.confirmBtnText}>{loading ? "Confirmando..." : "Confirmar"}</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            {metodo === "mercado"
              ? "Al confirmar, te llevaremos a Mercado Pago para completar el cobro."
              : "Al confirmar, se validará el pago y se iniciará el recorrido del paseador."}
          </Text>
        </View>
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
