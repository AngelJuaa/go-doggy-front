import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { styles } from "./editarDireccionClienteDetallesStyles";
import { apiFetch } from "../../utils/api";
import storage from "../../utils/storage";

const INITIAL_FORM = {
  codigoPostal: "",
  pais: "",
  estado: "",
  ciudad: "",
  colonia: "",
  calle: "",
  numeroExterior: "",
  numeroInterior: "",
  referencias: "",
  latitud: "",
  longitud: "",
};

export default function EditarDireccionClienteDetalles({ route, navigation }) {
  const { direccion } = route.params || {};
  const [form, setForm] = useState(INITIAL_FORM);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [focusedField, setFocusedField] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usuarioId, setUsuarioId] = useState(null);
  const [error, setError] = useState("");

  const isFormValid = useMemo(() => {
    return (
      form.codigoPostal.trim().length === 5 &&
      form.pais.trim().length > 0 &&
      form.estado.trim().length > 0 &&
      form.ciudad.trim().length > 0 &&
      form.colonia.trim().length > 0 &&
      form.calle.trim().length > 0 &&
      form.numeroExterior.trim().length > 0 &&
      !guardando
    );
  }, [form, guardando]);

  useEffect(() => {
    const usuarioGuardado = storage.getItem("usuario");
    if (usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado);
        setUsuarioId(Number(usuario?.usuario_id) || null);
      } catch (e) {
        setUsuarioId(null);
      }
    }

    if (direccion) {
      setForm({
        codigoPostal: String(direccion.codigo_postal || ""),
        pais: String(direccion.pais || ""),
        estado: String(direccion.estado || ""),
        ciudad: String(direccion.ciudad || ""),
        colonia: String(direccion.colonia || ""),
        calle: String(direccion.calle || ""),
        numeroExterior: String(direccion.numero_calle || direccion.numero_externo || ""),
        numeroInterior: String(direccion.numero_interior || ""),
        referencias: String(direccion.referencias_Casa || direccion.referencias_casa || direccion.referencias || ""),
        latitud: String(direccion.latitud || ""),
        longitud: String(direccion.longitud || ""),
      });
    }

    setLoading(false);
  }, [direccion]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const getInputStyle = (field, extraStyles = []) => {
    const stylesArr = [styles.input];
    if (focusedField === field) stylesArr.push(styles.inputFocused);
    if (Array.isArray(extraStyles)) return [...stylesArr, ...extraStyles];
    if (extraStyles) stylesArr.push(extraStyles);
    return stylesArr;
  };

  const geocodeDireccion = async ({ calle, numeroExterior, colonia, ciudad, estado, pais, codigoPostal }) => {
    const query = new URLSearchParams();
    if (calle) query.append("calle", calle);
    if (numeroExterior) query.append("numero_calle", numeroExterior);
    if (numeroExterior) query.append("numero_externo", numeroExterior);
    if (colonia) query.append("colonia", colonia);
    if (ciudad) query.append("ciudad", ciudad);
    if (estado) query.append("estado", estado);
    if (pais) query.append("pais", pais);
    if (codigoPostal) query.append("codigo_postal", codigoPostal);

    if (!query.toString()) return null;

    try {
      const data = await apiFetch(`/direccion/geocode?${query.toString()}`);
      if (!Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) return null;
      return {
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
      };
    } catch (error) {
      console.warn("Error geocodificando direccion:", error);
      return null;
    }
  };

  const handleGuardar = async () => {
    setError("");

    console.log("[direccion] iniciando actualizacion", {
      direccionId: direccion?.direccion_id || direccion?.direccionId || direccion?.id,
    });

    if (!isFormValid) {
      console.warn("[direccion] formulario incompleto al intentar actualizar");
      Alert.alert("Formulario incompleto", "Completa los campos obligatorios.");
      return;
    }

    if (!usuarioId) {
      console.warn("[direccion] no se encontro usuario en sesion al actualizar");
      Alert.alert("Error", "No se encontro el usuario de la sesion");
      return;
    }

    let lat = Number(form.latitud);
    let lng = Number(form.longitud);

    if (
      form.calle.trim() &&
      form.numeroExterior.trim() &&
      form.colonia.trim() &&
      form.ciudad.trim() &&
      form.estado.trim() &&
      form.pais.trim()
    ) {
      const geocoded = await geocodeDireccion({
        calle: form.calle.trim(),
        numeroExterior: form.numeroExterior.trim(),
        colonia: form.colonia.trim(),
        ciudad: form.ciudad.trim(),
        estado: form.estado.trim(),
        pais: form.pais.trim(),
        codigoPostal: form.codigoPostal.trim(),
      });
      if (geocoded) {
        lat = geocoded.latitude;
        lng = geocoded.longitude;
        setForm((prev) => ({
          ...prev,
          latitud: String(lat),
          longitud: String(lng),
        }));
      }
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
      Alert.alert(
        "Error de geolocalización",
        "No se pudieron obtener coordenadas precisas para tu dirección. Revisa los datos e intenta de nuevo."
      );
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        usuario_id: usuarioId,
        codigo_postal: form.codigoPostal.trim(),
        pais: form.pais.trim(),
        estado: form.estado.trim(),
        ciudad: form.ciudad.trim(),
        colonia: form.colonia.trim(),
        calle: form.calle.trim(),
        numero_calle: form.numeroExterior.trim(),
        numero_externo: form.numeroExterior.trim(),
        referencias_casa: form.referencias.trim(),
        latitud: lat,
        longitud: lng,
      };

      const response = await apiFetch(`/direccion/${direccion.direccion_id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      console.log("[direccion] actualizacion exitosa", {
        direccionId: direccion.direccion_id,
        response,
      });

      if (response?.message) {
        Alert.alert("Direccion actualizada", "Los cambios se guardaron correctamente", [
          {
            text: "OK",
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: "MapaCliente", params: { refreshDirecciones: Date.now() } }],
              }),
          },
        ]);
      }
    } catch (err) {
      console.error("[direccion] error actualizando direccion", err);
      setError(err.message || "No se pudo actualizar la direccion");
      Alert.alert("Error", err.message || "No se pudo actualizar la direccion");
    } finally {
      console.log("[direccion] finalizo intento de actualizacion");
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#A67C52" />
          <Text style={styles.loadingText}>Cargando direccion...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.navIcon}>↩</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Editar direccion</Text>
          <Text style={styles.subtitle}>Modifica los datos guardados en tu perfil.</Text>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Datos de la direccion</Text>

            <Text style={styles.label}>Codigo postal *</Text>
            <TextInput
              value={form.codigoPostal}
              onChangeText={(value) => updateField("codigoPostal", value.replace(/\D/g, "").slice(0, 5))}
              onFocus={() => setFocusedField("codigoPostal")}
              onBlur={() => setFocusedField("")}
              placeholder="00000"
              placeholderTextColor="#9A9A9A"
              keyboardType="number-pad"
              maxLength={5}
              style={getInputStyle("codigoPostal")}
            />

            <Text style={styles.label}>Pais *</Text>
            <TextInput style={[styles.input, styles.inputDisabled]} value={form.pais} editable={false} />

            <Text style={styles.label}>Estado *</Text>
            <TextInput style={[styles.input, styles.inputDisabled]} value={form.estado} editable={false} />

            <Text style={styles.label}>Ciudad *</Text>
            <TextInput style={[styles.input, styles.inputDisabled]} value={form.ciudad} editable={false} />

            <Text style={styles.label}>Colonia *</Text>
            <TextInput style={[styles.input, styles.inputDisabled]} value={form.colonia} editable={false} />

            <Text style={styles.label}>Calle *</Text>
            <TextInput
              value={form.calle}
              onChangeText={(value) => updateField("calle", value)}
              onFocus={() => setFocusedField("calle")}
              onBlur={() => setFocusedField("")}
              placeholder="Nombre de la calle"
              placeholderTextColor="#9A9A9A"
              style={getInputStyle("calle")}
            />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>No. exterior *</Text>
                <TextInput
                  value={form.numeroExterior}
                  onChangeText={(value) => updateField("numeroExterior", value)}
                  onFocus={() => setFocusedField("numeroExterior")}
                  onBlur={() => setFocusedField("")}
                  placeholder="123"
                  placeholderTextColor="#9A9A9A"
                  style={getInputStyle("numeroExterior")}
                />
              </View>

              <View style={styles.rowItem}>
                <Text style={styles.label}>No. interior</Text>
                <TextInput
                  value={form.numeroInterior}
                  onChangeText={(value) => updateField("numeroInterior", value)}
                  onFocus={() => setFocusedField("numeroInterior")}
                  onBlur={() => setFocusedField("")}
                  placeholder="A-1"
                  placeholderTextColor="#9A9A9A"
                  style={getInputStyle("numeroInterior")}
                />
              </View>
            </View>

            <Text style={styles.label}>Referencias</Text>
            <TextInput
              value={form.referencias}
              onChangeText={(value) => updateField("referencias", value)}
              onFocus={() => setFocusedField("referencias")}
              onBlur={() => setFocusedField("")}
              placeholder="Color del porton, entre calles, puntos de referencia..."
              placeholderTextColor="#9A9A9A"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={getInputStyle("referencias", styles.textArea)}
            />

            <TouchableOpacity
              style={[styles.saveButton, (!isFormValid || guardando) && styles.saveButtonDisabled]}
              onPress={handleGuardar}
            >
              <Text style={styles.saveButtonText}>
                {guardando ? "Guardando..." : "Guardar cambios"}
              </Text>
            </TouchableOpacity>

            {error ? <Text style={styles.helperText}>{error}</Text> : null}
          </View>
        </ScrollView>

        <View style={styles.bottomTab}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("Inicio_cliente")}>
            <Text style={styles.tabLabel}>Inicio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("Servicio_Cliente_Inicio")}>
            <Text style={styles.tabLabel}>Servicio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("MapaCliente")}>
            <Text style={styles.tabLabel}>Mapa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("NotificacionesCliente")}>
            <Text style={styles.tabLabel}>Notificaciones</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
