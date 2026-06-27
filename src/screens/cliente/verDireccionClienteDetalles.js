import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { s, vs, ms } from "../../utils/responsive";
import { apiFetch } from "../../utils/api";
import storage from "../../utils/storage";

const getValue = (direccion, keys, fallback = "Sin registro") => {
  for (const key of keys) {
    const value = direccion?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }
  return fallback;
};

export default function VerDireccionClienteDetalles({ route, navigation }) {
  const { direccion } = route.params || {};
  const [hoveredTab, setHoveredTab] = useState(null);
  const direccionId = Number(direccion?.direccion_id || direccion?.direccionId || direccion?.id || 0);

  const usuarioGuardado = storage.getItem("usuario");
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

  const irEditar = () => {
    navigation.navigate("editarDireccionClienteDetalles", { direccion });
  };

  const eliminarDireccion = async () => {
    if (!direccionId) {
      console.warn("[direccion] no se pudo identificar el id para eliminar", direccion);
      Alert.alert("Error", "No se pudo identificar la direccion a eliminar.");
      return;
    }

    console.log("[direccion] iniciando eliminacion", { direccionId });

    try {
      console.log("[direccion] enviando DELETE al backend", { direccionId });
      await apiFetch(`/direccion/${direccionId}`, { method: "DELETE" });

      console.log("[direccion] eliminacion exitosa", { direccionId });

      navigation.reset({
        index: 0,
        routes: [{ name: "MapaCliente", params: { refreshDirecciones: Date.now() } }],
      });

      Alert.alert("Exito", "La direccion se elimino correctamente");
    } catch (error) {
      console.error("[direccion] error eliminando direccion", error);
      Alert.alert("Error", error.message || "No se pudo eliminar la direccion");
    }
  };

  const detalles = [
    { label: "Codigo postal", value: getValue(direccion, ["codigo_postal", "codigoPostal"]) },
    { label: "Pais", value: getValue(direccion, ["pais"]) },
    { label: "Estado", value: getValue(direccion, ["estado"]) },
    { label: "Ciudad", value: getValue(direccion, ["ciudad"]) },
    { label: "Colonia", value: getValue(direccion, ["colonia"]) },
    { label: "Calle", value: getValue(direccion, ["calle"]) },
    {
      label: "Numero exterior",
      value: getValue(direccion, ["numero_calle", "numero_externo", "numeroExterior"]),
    },
    {
      label: "Numero interior",
      value: getValue(direccion, ["numero_interior", "numeroInterior"], "Sin registro"),
    },
    {
      label: "Referencias",
      value: getValue(direccion, ["referencias_Casa", "referencias_casa", "referencias"]),
    },
    {
      label: "Latitud",
      value: getValue(direccion, ["latitud"], "Sin registro"),
    },
    {
      label: "Longitud",
      value: getValue(direccion, ["longitud"], "Sin registro"),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>↩</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Detalle de direccion</Text>
        <Text style={styles.subtitle}>Informacion guardada en tu perfil.</Text>

        <View style={styles.card}>
          {detalles.map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{item.value}</Text>
            </View>
          ))}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.editButton} onPress={irEditar}>
              <Text style={styles.actionText}>Editar direccion</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={eliminarDireccion}>
              <Text style={styles.actionText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },
  headerRow: {
    paddingHorizontal: s(18),
    paddingTop: vs(50),
    alignItems: "flex-start",
  },
  backText: {
    fontSize: ms(28),
    color: "#333",
  },
  content: {
    paddingHorizontal: s(16),
    paddingTop: vs(10),
    paddingBottom: vs(24),
  },
  title: {
    fontSize: ms(28),
    textAlign: "center",
    color: "#222",
    fontFamily: "serif",
    marginBottom: vs(4),
  },
  subtitle: {
    fontSize: ms(14),
    color: "#666",
    textAlign: "center",
    marginBottom: vs(18),
  },
  card: {
    backgroundColor: "#99D9C1",
    borderRadius: s(20),
    padding: s(18),
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  row: {
    marginBottom: vs(12),
  },
  label: {
    fontSize: ms(13),
    fontWeight: "700",
    color: "#4C4C4C",
    marginBottom: vs(4),
  },
  value: {
    fontSize: ms(15),
    color: "#222",
    backgroundColor: "rgba(255,255,255,0.65)",
    paddingVertical: vs(10),
    paddingHorizontal: s(12),
    borderRadius: s(12),
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: s(10),
    marginTop: vs(8),
  },
  editButton: {
    flex: 1,
    backgroundColor: "#E6B5B5",
    borderRadius: s(14),
    paddingVertical: vs(12),
    alignItems: "center",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#A67C52",
    borderRadius: s(14),
    paddingVertical: vs(12),
    alignItems: "center",
  },
  actionText: {
    color: "#222",
    fontWeight: "700",
    fontSize: ms(13),
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
