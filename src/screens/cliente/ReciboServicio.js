import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Platform,
} from "react-native";
import { apiFetch } from "../../utils/api";

export default function ReciboServicio({ route, navigation }) {
  const {
    servicioId,
    monto,
    metodoPago     = "Pago",
    referencia,
    tipoServicio   = "",
    subtipo        = "",
    mascotaNombre  = "",
    paseadorNombre = "",
    duracion       = "",
    comision:      comisionParam    = null,
    montoPaseador: montoPaseadorParam = null,
  } = route?.params || {};

  const [recibo, setRecibo]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!servicioId) { setLoading(false); return; }
    apiFetch(`/servicio/${servicioId}/recibo`)
      .then((d) => setRecibo(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [servicioId]);

  const folio = recibo?.pago_referencia || referencia
    || `GD-${servicioId || "0"}-${Date.now().toString(36).toUpperCase()}`;

  const fecha = (() => {
    const src = recibo?.pago_fecha ? new Date(recibo.pago_fecha) : new Date();
    return src.toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" });
  })();

  const montoFinal      = parseFloat(recibo?.pago_monto || recibo?.costo_total || monto || 0).toFixed(2);
  const metodoFinal     = recibo?.pago_metodo    || metodoPago;
  const mascotaFinal    = recibo?.mascota_nombre  || mascotaNombre;
  const paseadorFinal   = recibo?.paseador_nombre || paseadorNombre;
  const tipoFinal       = recibo?.tipo_servicio   || tipoServicio;
  const durFinal        = recibo?.duracion_minutos || duracion;
  const comisionFinal   = parseFloat(recibo?.comision_app  ?? comisionParam  ?? (parseFloat(montoFinal) * 0.15)).toFixed(2);
  const montoPaseFinal  = parseFloat(recibo?.monto_paseador ?? montoPaseadorParam ?? (parseFloat(montoFinal) * 0.85)).toFixed(2);

  const handleImprimir = () => {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.print) {
      window.print();
    }
  };

  if (loading) {
    return (
      <View style={[r.root, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#99D9C1" />
      </View>
    );
  }

  return (
    <View style={r.root}>
      <ScrollView contentContainerStyle={r.scroll} showsVerticalScrollIndicator={false}>
        {/* SUCCESS BADGE */}
        <View style={r.successBadge}>
          <Text style={r.successIcon}>✅</Text>
          <Text style={r.successTxt}>¡Pago exitoso!</Text>
          <Text style={r.successSub}>Gracias por usar GoDoggy 🐾</Text>
        </View>

        {/* RECIBO */}
        <View style={r.receipt}>
          {/* Encabezado GoDoggy */}
          <View style={r.receiptHeader}>
            <Text style={r.brand}>🐾 GoDoggy</Text>
            <Text style={r.brandSub}>Tu app de paseos de confianza</Text>
            <Text style={r.brandSub}>San Miguel de Allende, Gto., México</Text>
          </View>

          <Dashed />

          {/* Folio y fecha */}
          <FolioRow label="Folio" value={folio} mono />
          <FolioRow label="Fecha" value={fecha} />

          <Dashed />
          <SecHead>DETALLE DEL SERVICIO</SecHead>

          {tipoFinal ? (
            <RRow label="Servicio"
              value={recibo?.subtipo || subtipo
                ? `${tipoFinal} — ${recibo?.subtipo || subtipo}`
                : tipoFinal} />
          ) : null}
          {mascotaFinal  ? <RRow label="Mascota"   value={`🐶 ${mascotaFinal}`} /> : null}
          {paseadorFinal ? <RRow label="Paseador"  value={`👤 ${paseadorFinal}`} /> : null}
          {durFinal      ? <RRow label="Duración"  value={`${durFinal} min`} /> : null}

          <Dashed />
          <SecHead>INFORMACIÓN DE PAGO</SecHead>

          <RRow label="Método" value={metodoFinal} />
          <RRow label="Subtotal servicio" value={`$${montoFinal} MXN`} />
          <RRow label="Comisión GoDoggy (15%)" value={`$${comisionFinal} MXN`} sub />
          <RRow label="Paseador recibe (85%)" value={`$${montoPaseFinal} MXN`} sub />

          <View style={r.totalBox}>
            <Text style={r.totalBoxLabel}>TOTAL PAGADO</Text>
            <Text style={r.totalBoxVal}>${montoFinal} MXN</Text>
          </View>

          <Dashed />

          {/* Pie de recibo */}
          <Text style={r.footerTxt}>GoDoggy — godoggy@gmail.com</Text>
          <Text style={r.footerTxt}>Este documento es comprobante de pago</Text>
          <Text style={r.footerTxt}>Conserva este recibo para cualquier aclaración</Text>

          {/* Código de barras decorativo */}
          <View style={r.barcodeWrap}>
            {Array.from({ length: 44 }).map((_, i) => (
              <View
                key={i}
                style={[
                  r.barLine,
                  {
                    width:   i % 4 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
                    height:  i % 5 === 0 ? 30 : 38,
                    opacity: i % 6 === 0 ? 0.25 : 0.7,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* ACCIONES */}
        {Platform.OS === "web" && (
          <TouchableOpacity style={[r.actionBtn, { backgroundColor: "#555" }]} onPress={handleImprimir}>
            <Text style={r.actionBtnTxt}>🖨️ Imprimir recibo</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[r.actionBtn, { backgroundColor: "#99D9C1" }]}
          onPress={() => navigation.navigate("Inicio_cliente")}
        >
          <Text style={[r.actionBtnTxt, { color: "#1A1A1A" }]}>🏠 Ir al inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[r.actionBtn, { backgroundColor: "rgba(255,255,255,0.12)" }]}
          onPress={() => navigation.navigate("HistorialCliente")}
        >
          <Text style={[r.actionBtnTxt, { color: "#c5e8db" }]}>📋 Ver historial de paseos</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/* ── Helpers de UI ────────────────────────────────────────────────────────── */
function Dashed() {
  return <View style={r.dashed} />;
}

function SecHead({ children }) {
  return <Text style={r.secHead}>{children}</Text>;
}

function FolioRow({ label, value, mono }) {
  return (
    <View style={r.folioRow}>
      <Text style={r.folioLabel}>{label}:</Text>
      <Text
        style={[r.folioVal, mono && Platform.OS === "web" ? { fontFamily: "monospace" } : null]}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {value}
      </Text>
    </View>
  );
}

function RRow({ label, value, sub }) {
  return (
    <View style={r.rRow}>
      <Text style={[r.rLabel, sub && { fontSize: 11, color: "#bbb" }]}>{label}</Text>
      <Text style={[r.rVal,   sub && { fontSize: 11, color: "#bbb" }]}>{value}</Text>
    </View>
  );
}

/* ── Estilos ─────────────────────────────────────────────────────────────── */
const r = StyleSheet.create({
  root:  { flex: 1, backgroundColor: "#1A3D2B", height: "100vh" },
  scroll: { padding: 20, paddingTop: 56, paddingBottom: 44, alignItems: "center" },

  successBadge: { alignItems: "center", marginBottom: 28 },
  successIcon:  { fontSize: 64, marginBottom: 10 },
  successTxt:   { color: "#fff", fontSize: 28, fontWeight: "800" },
  successSub:   { color: "#99D9C1", fontSize: 14, marginTop: 5 },

  receipt: {
    backgroundColor: "#fff", borderRadius: 20, padding: 22,
    width: "100%", maxWidth: 420,
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    marginBottom: 24,
  },

  receiptHeader: { alignItems: "center", paddingBottom: 18 },
  brand:         { fontSize: 26, fontWeight: "900", color: "#1A3D2B", letterSpacing: 0.5 },
  brandSub:      { fontSize: 11, color: "#999", marginTop: 3 },

  dashed: { borderStyle: "dashed", borderTopWidth: 1.5, borderColor: "#ddd", marginVertical: 14 },

  folioRow:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  folioLabel:{ fontSize: 12, color: "#aaa", fontWeight: "600" },
  folioVal:  { fontSize: 12, color: "#444", fontWeight: "600", maxWidth: "65%", textAlign: "right" },

  secHead: { fontSize: 10, fontWeight: "700", color: "#bbb", letterSpacing: 2.5, marginBottom: 10, textTransform: "uppercase" },

  rRow:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  rLabel: { fontSize: 13, color: "#777" },
  rVal:   { fontSize: 13, fontWeight: "600", color: "#333" },

  totalBox: {
    backgroundColor: "#EDF9F4", borderRadius: 12, padding: 14,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8,
  },
  totalBoxLabel: { fontSize: 13, fontWeight: "700", color: "#1A3D2B" },
  totalBoxVal:   { fontSize: 22, fontWeight: "900", color: "#22a06b" },

  footerTxt: { fontSize: 10, color: "#ccc", textAlign: "center", marginTop: 5 },

  barcodeWrap: {
    flexDirection: "row", justifyContent: "center", alignItems: "flex-end",
    height: 44, marginTop: 18, gap: 2, overflow: "hidden",
  },
  barLine: { backgroundColor: "#333", borderRadius: 1 },

  actionBtn: {
    borderRadius: 16, paddingVertical: 15, paddingHorizontal: 24,
    alignItems: "center", marginBottom: 10, width: "100%", maxWidth: 420,
  },
  actionBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
