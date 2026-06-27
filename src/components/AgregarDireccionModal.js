import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  ScrollView, StyleSheet, Switch, ActivityIndicator,
} from "react-native";
import { s, vs, ms } from "../utils/responsive";
import { apiFetch } from "../utils/api";
import storage from "../utils/storage";
import useToast from "../utils/useToast";

const SUFIJOS = ["", "A", "B", "C", "D", "E", "F"];
const TIPOS_VIVIENDA = [
  { value: "casa_calle",             label: "🏠 Casa de calle" },
  { value: "condominio_horizontal",  label: "🏘 Condominio horizontal" },
  { value: "edificio_departamentos", label: "🏢 Edificio / Depto." },
  { value: "privada_residencial",    label: "🔐 Privada residencial" },
];

export default function AgregarDireccionModal({
  visible,
  onClose,
  onSaved,
  currentLat,
  currentLng,
  onLocationChange,
}) {
  const [nombreRef, setNombreRef]         = useState("");
  const [calle, setCalle]                 = useState("");
  const [numExt, setNumExt]               = useState("");
  const [numInt, setNumInt]               = useState("");
  const [sufijo, setSufijo]               = useState("");
  const [colonia, setColonia]             = useState("");
  const [cp, setCp]                       = useState("");
  const [tipoVivienda, setTipoVivienda]   = useState("");
  const [tieneCaseta, setTieneCaseta]     = useState(false);
  const [instrucciones, setInstrucciones] = useState("");
  const [saving, setSaving]               = useState(false);

  // Coordenadas internas — se actualizan al seleccionar sugerencia
  const [localLat, setLocalLat] = useState(null);
  const [localLng, setLocalLng] = useState(null);

  // Autocomplete de calles
  const [sugerencias, setSugerencias]     = useState([]);
  const [buscandoCalle, setBuscandoCalle] = useState(false);
  const searchRef                         = useRef(null);

  const { showToast, ToastComponent } = useToast();

  // Sincronizar coords cuando el usuario mueve el pin del mapa
  useEffect(() => {
    setLocalLat(currentLat);
    setLocalLng(currentLng);
  }, [currentLat, currentLng]);

  // Autocompletar calle con debounce
  // Con CP de 5 dígitos basta 1 carácter; sin CP se necesitan 3
  useEffect(() => {
    const minChars = cp.length === 5 ? 1 : 3;
    if (calle.length < minChars) { setSugerencias([]); return; }
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => buscarCalle(calle), 500);
    return () => clearTimeout(searchRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calle, cp]);

  const buscarCalle = async (query) => {
    setBuscandoCalle(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (cp.length === 5) params.append("cp", cp);
      const data = await apiFetch(`/geocode/search?${params.toString()}`);
      const resultados = (data || []).map((r) => ({
        road: r.address?.road
           || r.address?.pedestrian
           || r.address?.residential
           || r.address?.cycleway
           || r.name
           || query,
        suburb: r.address?.suburb
             || r.address?.neighbourhood
             || r.address?.city_district
             || r.address?.quarter
             || "",
        cpResult: r.address?.postcode || "",
        city: r.address?.city || r.address?.town || r.address?.village || "",
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        display: r.display_name,
      }));
      // Deduplicar por coordenadas aproximadas
      const vistos = new Set();
      const unicos = resultados.filter((r) => {
        const key = `${r.road}|${r.suburb}`;
        if (vistos.has(key)) return false;
        vistos.add(key);
        return true;
      });
      setSugerencias(unicos.slice(0, 7));
    } catch {
      setSugerencias([]);
    } finally {
      setBuscandoCalle(false);
    }
  };

  const seleccionarSugerencia = (sug) => {
    setCalle(sug.road);
    if (sug.suburb) setColonia(sug.suburb);
    if (sug.cpResult) setCp(sug.cpResult);
    setLocalLat(sug.lat);
    setLocalLng(sug.lng);
    onLocationChange?.(sug.lat, sug.lng);
    setSugerencias([]);
  };

  const resetForm = () => {
    setNombreRef(""); setCalle(""); setNumExt(""); setNumInt("");
    setSufijo(""); setColonia(""); setCp(""); setTipoVivienda("");
    setTieneCaseta(false); setInstrucciones("");
    setSugerencias([]);
    setLocalLat(currentLat);
    setLocalLng(currentLng);
  };

  const handleSave = async () => {
    if (!calle.trim()) { showToast("La calle es obligatoria", "error"); return; }
    const u = JSON.parse(storage.getItem("usuario") || "{}");
    if (!u.usuario_id) { showToast("Sesión no encontrada", "error"); return; }
    setSaving(true);
    try {
      const nueva = await apiFetch("/direcciones", {
        method: "POST",
        body: JSON.stringify({
          usuario_id:           u.usuario_id,
          nombre_referencia:    nombreRef.trim() || "Mi dirección",
          calle:                calle.trim(),
          numero_exterior:      numExt.trim(),
          numero_interior:      numInt.trim(),
          sufijo_numero:        sufijo,
          colonia:              colonia.trim(),
          codigo_postal:        cp.trim(),
          latitud:              localLat,
          longitud:             localLng,
          tipo_vivienda:        tipoVivienda,
          tiene_caseta:         tieneCaseta,
          instrucciones_acceso: instrucciones.trim(),
        }),
      });
      resetForm();
      onSaved(nueva);
      onClose();
    } catch (e) {
      showToast(e.message || "Error al guardar dirección", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { resetForm(); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>📍 Nueva dirección</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeTouch}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.form}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Nombre de referencia ── */}
            <Text style={styles.label}>Nombre de referencia</Text>
            <TextInput
              style={styles.input}
              placeholder="ej. Casa, Trabajo, Gym..."
              placeholderTextColor="#aaa"
              value={nombreRef}
              onChangeText={setNombreRef}
            />

            {/* ── Código Postal (primero para contexto del autocompletar) ── */}
            <Text style={styles.label}>
              Código Postal{" "}
              <Text style={styles.hint}>(ingrésalo primero para mejores sugerencias)</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="37700 — San Miguel de Allende"
              placeholderTextColor="#aaa"
              value={cp}
              onChangeText={(v) => { setCp(v.replace(/\D/g, "").slice(0, 5)); }}
              keyboardType="numeric"
              maxLength={5}
            />

            {/* ── Calle con autocompletar ── */}
            <Text style={styles.label}>
              Calle <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.calleWrap}>
              <TextInput
                style={styles.input}
                placeholder="Escribe el nombre de la calle..."
                placeholderTextColor="#aaa"
                value={calle}
                onChangeText={setCalle}
              />
              {buscandoCalle && (
                <ActivityIndicator
                  size="small"
                  color="#22a06b"
                  style={styles.calleSpinner}
                />
              )}
            </View>

            {/* Sugerencias de calles */}
            {sugerencias.length > 0 && (
              <View style={styles.suggestionsBox}>
                {sugerencias.map((sug, i) => (
                  <TouchableOpacity
                    key={`${sug.road}-${i}`}
                    style={[
                      styles.suggestionItem,
                      i < sugerencias.length - 1 && styles.suggestionBorder,
                    ]}
                    onPress={() => seleccionarSugerencia(sug)}
                  >
                    <Text style={styles.suggestionRoad} numberOfLines={1}>
                      📍 {sug.road}
                    </Text>
                    {(sug.suburb || sug.city) ? (
                      <Text style={styles.suggestionSub} numberOfLines={1}>
                        {[sug.suburb, sug.city, sug.cpResult].filter(Boolean).join(", ")}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ── Número exterior + interior ── */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Núm. Exterior</Text>
                <TextInput
                  style={styles.input}
                  placeholder="45"
                  placeholderTextColor="#aaa"
                  value={numExt}
                  onChangeText={setNumExt}
                />
              </View>
              <View style={styles.colGap} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Núm. Interior</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3"
                  placeholderTextColor="#aaa"
                  value={numInt}
                  onChangeText={setNumInt}
                />
              </View>
            </View>

            {/* ── Sufijo ── */}
            <Text style={styles.label}>Sufijo del número (ej. 13A, 13B)</Text>
            <View style={styles.chipRow}>
              {SUFIJOS.map((sufVal) => (
                <TouchableOpacity
                  key={sufVal === "" ? "ninguno" : sufVal}
                  style={[styles.chip, sufijo === sufVal && styles.chipActive]}
                  onPress={() => setSufijo(sufVal)}
                >
                  <Text style={[styles.chipTxt, sufijo === sufVal && styles.chipTxtActive]}>
                    {sufVal === "" ? "Ninguno" : sufVal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Colonia ── */}
            <Text style={styles.label}>Colonia</Text>
            <TextInput
              style={styles.input}
              placeholder="Se rellena al seleccionar calle o escribe manualmente"
              placeholderTextColor="#aaa"
              value={colonia}
              onChangeText={setColonia}
            />

            {/* ── Coordenadas GPS ── */}
            <View style={styles.gpsBox}>
              <Text style={styles.gpsTitle}>📡 Coordenadas GPS</Text>
              <Text style={styles.gpsCoords}>
                {localLat && localLng
                  ? `Lat: ${Number(localLat).toFixed(6)}   Lng: ${Number(localLng).toFixed(6)}`
                  : "Selecciona una calle o arrastra el pin en el mapa"}
              </Text>
              <Text style={styles.gpsHint}>
                Al seleccionar una sugerencia, el mapa se actualiza automáticamente.
              </Text>
            </View>

            {/* ── Tipo de vivienda ── */}
            <Text style={styles.label}>Tipo de vivienda</Text>
            <View style={styles.tipoGrid}>
              {TIPOS_VIVIENDA.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.tipoBtn, tipoVivienda === t.value && styles.tipoBtnActive]}
                  onPress={() => setTipoVivienda(t.value)}
                >
                  <Text style={[styles.tipoBtnTxt, tipoVivienda === t.value && styles.tipoBtnTxtActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Caseta de vigilancia ── */}
            <View style={styles.casetaRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>¿Hay caseta de vigilancia?</Text>
                <Text style={styles.casetaHint}>El paseador deberá identificarse o anotarse</Text>
              </View>
              <Switch
                value={tieneCaseta}
                onValueChange={setTieneCaseta}
                trackColor={{ false: "#ddd", true: "#99D9C1" }}
                thumbColor={tieneCaseta ? "#22a06b" : "#f4f3f4"}
              />
            </View>

            {/* ── Instrucciones de acceso ── */}
            <Text style={styles.label}>Instrucciones de acceso</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="El paseador debe tocar el timbre 2 veces. Acceso por puerta lateral..."
              placeholderTextColor="#aaa"
              value={instrucciones}
              onChangeText={setInstrucciones}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* ── Guardar ── */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnTxt}>Guardar dirección</Text>
              }
            </TouchableOpacity>
          </ScrollView>

          {ToastComponent}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.52)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: s(24),
    borderTopRightRadius: s(24),
    maxHeight: "90%",
    paddingBottom: vs(20),
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: s(20),
    paddingVertical: vs(16),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: { fontSize: ms(17), fontWeight: "bold", color: "#1a1a1a" },
  closeTouch:  { padding: s(6) },
  closeBtn:    { fontSize: ms(18), color: "#999" },

  form: { paddingHorizontal: s(20), paddingTop: vs(8), paddingBottom: vs(40) },

  label:    { fontSize: ms(12), fontWeight: "600", color: "#555", marginTop: vs(14), marginBottom: vs(4) },
  hint:     { fontSize: ms(11), color: "#aaa", fontWeight: "400" },
  required: { color: "#e53e3e" },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: s(10),
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    fontSize: ms(14),
    backgroundColor: "#fafafa",
    color: "#222",
  },
  inputMulti: { minHeight: vs(70) },

  calleWrap:   { position: "relative" },
  calleSpinner: { position: "absolute", right: s(10), top: vs(10) },

  // Sugerencias
  suggestionsBox: {
    borderWidth: 1,
    borderColor: "#99D9C1",
    borderRadius: s(10),
    backgroundColor: "#fff",
    marginTop: vs(2),
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  suggestionItem: {
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    backgroundColor: "#fff",
  },
  suggestionBorder: { borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  suggestionRoad:   { fontSize: ms(13), color: "#222", fontWeight: "600" },
  suggestionSub:    { fontSize: ms(11), color: "#888", marginTop: vs(1) },

  row:    { flexDirection: "row" },
  colGap: { width: s(10) },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: s(8) },
  chip: {
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  chipActive:    { borderColor: "#22a06b", backgroundColor: "#EDF9F4" },
  chipTxt:       { fontSize: ms(13), color: "#555" },
  chipTxtActive: { color: "#22a06b", fontWeight: "700" },

  gpsBox: {
    backgroundColor: "#F0F9F5",
    borderRadius: s(10),
    padding: s(12),
    marginTop: vs(14),
    borderLeftWidth: 3,
    borderLeftColor: "#99D9C1",
  },
  gpsTitle:  { fontSize: ms(12), fontWeight: "700", color: "#1a4731", marginBottom: vs(4) },
  gpsCoords: { fontSize: ms(12), color: "#333" },
  gpsHint:   { fontSize: ms(11), color: "#777", marginTop: vs(4), fontStyle: "italic" },

  tipoGrid: { flexDirection: "row", flexWrap: "wrap", gap: s(8) },
  tipoBtn: {
    paddingHorizontal: s(10),
    paddingVertical: vs(8),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
    flexBasis: "47%",
  },
  tipoBtnActive:    { borderColor: "#007bff", backgroundColor: "#EDF4FF" },
  tipoBtnTxt:       { fontSize: ms(12), color: "#555", textAlign: "center" },
  tipoBtnTxtActive: { color: "#007bff", fontWeight: "700", textAlign: "center" },

  casetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: vs(14),
    gap: s(12),
  },
  casetaHint: { fontSize: ms(11), color: "#999", marginTop: vs(2) },

  saveBtn: {
    backgroundColor: "#22a06b",
    borderRadius: s(14),
    paddingVertical: vs(14),
    alignItems: "center",
    marginTop: vs(22),
  },
  saveBtnTxt: { color: "#fff", fontSize: ms(15), fontWeight: "bold" },
});
