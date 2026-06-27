import React, { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, TextInput, Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { s, vs, ms } from "../../utils/responsive";
import { apiFetch } from "../../utils/api";
import storage from "../../utils/storage";
import useToast from "../../utils/useToast";

const FILTROS = ["Todos", "Completados", "Activos"];

const ESTADO_LABEL = {
  creado:     "⏳ Pendiente",
  en_camino:  "🚶 En camino",
  activo:     "🐾 En curso",
  completado: "✅ Completado",
  cancelado:  "❌ Cancelado",
};
const ESTADO_COLOR = {
  creado:     "#FFA500",
  en_camino:  "#007bff",
  activo:     "#28a745",
  completado: "#22a06b",
  cancelado:  "#dc3545",
};

export default function HistorialCliente({ navigation }) {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filtro, setFiltro]       = useState("Todos");
  const [hoveredTab, setHoveredTab] = useState(null);

  // Modal de calificación inline
  const [modalServicio, setModalServicio] = useState(null);
  const [rating, setRating]               = useState(0);
  const [comentario, setComentario]       = useState("");
  const [calificando, setCalificando]     = useState(false);

  const { showToast, ToastComponent } = useToast();

  useFocusEffect(
    useCallback(() => {
      const u = JSON.parse(storage.getItem("usuario") || "{}");
      if (u.usuario_id) cargar(u.usuario_id);
    }, [])
  );

  const cargar = async (id) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/servicios/cliente/${id}`);
      setServicios(data);
    } catch (e) {
      showToast("Error al cargar historial", "error");
    } finally {
      setLoading(false);
    }
  };

  const enviarCalificacion = async () => {
    if (rating === 0) { showToast("Selecciona al menos 1 estrella", "warning"); return; }
    if (!modalServicio?.paseador_id) { showToast("No se pudo identificar al paseador", "error"); return; }
    const u = JSON.parse(storage.getItem("usuario") || "{}");
    setCalificando(true);
    try {
      await apiFetch("/calificacion", {
        method: "POST",
        body: JSON.stringify({
          servicio_id:           modalServicio.servicio_id,
          califica_usuario_id:   u.usuario_id,
          calificado_usuario_id: modalServicio.paseador_id,
          valor:                 rating,
          comentario:            comentario,
        }),
      });
      setServicios((prev) =>
        prev.map((s) =>
          s.servicio_id === modalServicio.servicio_id
            ? { ...s, valor_calificacion: rating, calificacion_comentario: comentario }
            : s
        )
      );
      showToast("¡Calificación enviada! ⭐", "success");
      setModalServicio(null);
      setRating(0);
      setComentario("");
    } catch (e) {
      showToast(e.message || "Error al enviar calificación", "error");
    } finally {
      setCalificando(false);
    }
  };

  const filtrados = servicios.filter((s) => {
    if (filtro === "Completados") return s.estado === "completado";
    if (filtro === "Activos")     return ["creado", "en_camino", "activo"].includes(s.estado);
    return true;
  });

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>↩</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📋 Mis paseos</Text>
        <View />
      </View>

      {/* FILTROS */}
      <View style={styles.filtroRow}>
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filtroChip, filtro === f && styles.filtroSelected]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.filtroText, filtro === f && styles.filtroTextSelected]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#99D9C1" style={{ marginTop: vs(40) }} />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
          {filtrados.length === 0 ? (
            <Text style={styles.empty}>No hay servicios en esta categoría.</Text>
          ) : (
            filtrados.map((s) => (
              <View key={s.servicio_id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.mascota}>🐶 {s.mascota_nombre}</Text>
                  <View style={[styles.badge, { backgroundColor: ESTADO_COLOR[s.estado] || "#999" }]}>
                    <Text style={styles.badgeText}>{ESTADO_LABEL[s.estado] || s.estado}</Text>
                  </View>
                </View>

                <Text style={styles.detail}>
                  Tipo: {s.tipo_servicio} · {s.duracion_minutos} min
                </Text>
                {s.paseador_nombre && (
                  <Text style={styles.detail}>Paseador: {s.paseador_nombre}</Text>
                )}
                <Text style={styles.detail}>
                  Fecha: {new Date(s.hora_solicitada).toLocaleDateString("es-MX", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </Text>

                {s.estado === "completado" && (
                  <View style={styles.costoRow}>
                    <Text style={styles.costoText}>
                      💰 ${parseFloat(s.costo_total || s.costo_estimado || 0).toFixed(2)} MXN
                    </Text>
                    <Text style={styles.metodoText}>{s.metodo_pago || "Efectivo"}</Text>
                  </View>
                )}

                {s.estado === "completado" && s.valor_calificacion ? (
                  <View style={styles.califRow}>
                    <Text style={styles.califStars}>
                      {"⭐".repeat(parseInt(s.valor_calificacion))}
                    </Text>
                    {s.calificacion_comentario ? (
                      <Text style={styles.califComentario}>"{s.calificacion_comentario}"</Text>
                    ) : null}
                  </View>
                ) : s.estado === "completado" && s.paseador_id ? (
                  <TouchableOpacity
                    style={styles.califBtn}
                    onPress={() => { setModalServicio(s); setRating(0); setComentario(""); }}
                  >
                    <Text style={styles.califBtnText}>⭐ Calificar al paseador</Text>
                  </TouchableOpacity>
                ) : null}

                {["creado", "en_camino", "activo"].includes(s.estado) && (
                  <TouchableOpacity
                    style={styles.seguimientoBtn}
                    onPress={() => navigation.navigate("MapaCliente", { servicioId: s.servicio_id })}
                  >
                    <Text style={styles.seguimientoBtnText}>🗺️ Ver seguimiento</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* MODAL CALIFICACIÓN */}
      {modalServicio && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Calificar a {modalServicio.paseador_nombre}</Text>
            <Text style={styles.modalSub}>
              {modalServicio.tipo_servicio} · {new Date(modalServicio.hora_solicitada).toLocaleDateString("es-MX")}
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setRating(n)}>
                  <Text style={[styles.star, { color: n <= rating ? "#FFD700" : "#ccc" }]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.comentarioInput}
              placeholder="Comentario (opcional)"
              placeholderTextColor="#aaa"
              value={comentario}
              onChangeText={setComentario}
              multiline
              numberOfLines={2}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#f0f0f0" }]}
                onPress={() => { setModalServicio(null); setRating(0); setComentario(""); }}
              >
                <Text style={styles.modalBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: rating > 0 ? "#FFD700" : "#ccc", flex: 1 }]}
                disabled={calificando || rating === 0}
                onPress={enviarCalificacion}
              >
                {calificando
                  ? <ActivityIndicator color="#333" />
                  : <Text style={styles.modalBtnTxt}>⭐ Enviar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {ToastComponent}

      {/* BARRA INFERIOR */}
      <View style={styles.bottomTab}>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(0)}
          onMouseLeave={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("Inicio_cliente")}
        >
          {hoveredTab === 0 && <Text style={styles.tabLabel}>Inicio</Text>}
          <Image source={require("../../../assets/casa.png")} style={styles.tabIconImg} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(1)}
          onMouseLeave={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("Servicio_Cliente_Inicio")}
        >
          {hoveredTab === 1 && <Text style={styles.tabLabel}>Servicios</Text>}
          <Image source={require("../../../assets/puntos.png")} style={styles.tabIconImg} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, styles.tabActive]}
          onMouseEnter={() => setHoveredTab(2)}
          onMouseLeave={() => setHoveredTab(null)}
        >
          {hoveredTab === 2 && <Text style={styles.tabLabel}>Historial</Text>}
          <Text style={styles.tabIconText}>📋</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(3)}
          onMouseLeave={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("NotificacionesUsuario")}
        >
          {hoveredTab === 3 && <Text style={styles.tabLabel}>Notificaciones</Text>}
          <Image source={require("../../../assets/Notificaciones.png")} style={styles.tabIconImg} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  header:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: s(20), paddingTop: vs(50), paddingBottom: vs(10), backgroundColor: "#fff" },
  back:      { fontSize: ms(24) },
  title:     { fontSize: ms(18), fontWeight: "bold", color: "#333" },

  filtroRow:         { flexDirection: "row", padding: s(12), gap: s(8), backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  filtroChip:        { paddingHorizontal: s(16), paddingVertical: vs(6), borderRadius: s(20), backgroundColor: "#f0f0f0" },
  filtroSelected:    { backgroundColor: "#99D9C1" },
  filtroText:        { fontSize: ms(13), color: "#555", fontWeight: "600" },
  filtroTextSelected:{ color: "#fff" },

  content: { padding: s(16), paddingBottom: vs(20) },
  empty:   { textAlign: "center", color: "#999", marginTop: vs(40), fontSize: ms(14) },

  card:       { backgroundColor: "#fff", borderRadius: s(14), padding: s(16), marginBottom: vs(12), elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: vs(8) },
  mascota:    { fontSize: ms(15), fontWeight: "bold", color: "#333", flex: 1 },
  badge:      { paddingHorizontal: s(8), paddingVertical: vs(3), borderRadius: s(10) },
  badgeText:  { color: "#fff", fontSize: ms(10), fontWeight: "bold" },
  detail:     { fontSize: ms(12), color: "#666", marginBottom: vs(3) },

  costoRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#EDF9F4", borderRadius: s(8), padding: s(8), marginTop: vs(8) },
  costoText:  { fontSize: ms(13), fontWeight: "bold", color: "#22a06b" },
  metodoText: { fontSize: ms(12), color: "#666", fontStyle: "italic" },

  califRow:       { marginTop: vs(8), backgroundColor: "#FFFDE7", borderRadius: s(8), padding: s(8) },
  califStars:     { fontSize: ms(14) },
  califComentario:{ fontSize: ms(12), color: "#666", fontStyle: "italic", marginTop: vs(2) },
  califBtn:       { backgroundColor: "#FFF9C4", borderRadius: s(10), padding: s(8), alignItems: "center", marginTop: vs(8), borderWidth: 1, borderColor: "#FFD700" },
  califBtnText:   { color: "#B8860B", fontWeight: "bold", fontSize: ms(12) },

  seguimientoBtn:    { backgroundColor: "#E3F2FD", borderRadius: s(10), padding: s(8), alignItems: "center", marginTop: vs(8) },
  seguimientoBtnText:{ color: "#1565C0", fontWeight: "bold", fontSize: ms(12) },

  // Modal
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", zIndex: 100, padding: s(20) },
  modal:        { backgroundColor: "#fff", borderRadius: s(20), padding: s(24), width: "100%", maxWidth: 400 },
  modalTitle:   { fontSize: ms(16), fontWeight: "bold", color: "#333", marginBottom: vs(4) },
  modalSub:     { fontSize: ms(12), color: "#888", marginBottom: vs(14) },
  starsRow:     { flexDirection: "row", justifyContent: "center", gap: s(8), marginBottom: vs(14) },
  star:         { fontSize: 36 },
  comentarioInput: { backgroundColor: "#F5F5F0", borderRadius: s(10), padding: s(12), color: "#333", fontSize: ms(13), minHeight: vs(60), borderWidth: 1, borderColor: "#ddd", marginBottom: vs(14) },
  modalBtns:       { flexDirection: "row", gap: s(10) },
  modalBtn:        { paddingVertical: vs(12), paddingHorizontal: s(16), borderRadius: s(12), alignItems: "center", minWidth: s(80) },
  modalBtnTxt:     { fontWeight: "bold", fontSize: ms(14), color: "#333" },
  modalBtnCancelTxt: { fontWeight: "600", fontSize: ms(14), color: "#666" },

  // Bottom tab
  bottomTab:   { flexDirection: "row", backgroundColor: "#fff", height: vs(65), justifyContent: "space-around", alignItems: "center", borderTopWidth: 1, borderTopColor: "#eee" },
  tabItem:     { alignItems: "center", justifyContent: "center", flex: 1, height: "100%" },
  tabActive:   { borderTopWidth: 2, borderTopColor: "#99D9C1" },
  tabLabel:    { fontSize: ms(10), color: "#99D9C1", fontWeight: "bold", marginBottom: vs(2) },
  tabIconImg:  { width: s(24), height: s(24), resizeMode: "contain" },
  tabIconText: { fontSize: ms(22) },
});
