import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Platform, TextInput,
} from "react-native";
import { apiFetch } from "../../utils/api";

// ── Constantes ────────────────────────────────────────────────────────────────
const COMISION_RATE = 0.15;
const MP_PUBLIC_KEY = process.env.MP_PUBLIC_KEY || ""; // Reemplaza con tu Public Key de MP

const C = {
  bg:       "#F0F5F2",
  card:     "#FFFFFF",
  teal:     "#99D9C1",
  green:    "#22a06b",
  dark:     "#1A3D2B",
  sub:      "#666",
  text:     "#1A1A1A",
  mp:       "#009EE3",
  pp:       "#002991",
  border:   "#E0EDE8",
};

const METODOS = [
  { id: "tarjeta",      label: "Tarjeta",       icon: "💳", color: "#333"    },
  { id: "mercadopago",  label: "Mercado Pago",  icon: "💙", color: C.mp     },
  { id: "paypal",       label: "PayPal",         icon: "🅿️", color: C.pp     },
  { id: "efectivo",     label: "Efectivo",       icon: "💵", color: "#5A8A5A" },
];

function calcComision(monto) {
  return Math.round(monto * COMISION_RATE * 100) / 100;
}

export default function PagoServicio({ route, navigation }) {
  const {
    servicioId,
    monto         = 70,
    tipoServicio  = "Paseo",
    mascotaNombre  = "",
    paseadorNombre = "",
    duracion       = 30,
    metodoPrevio   = "",  // método elegido al solicitar el paseo
  } = route?.params || {};

  // Si el cliente ya eligió un método en PeticionPaseo, pre-seleccionarlo
  const defaultTab = (() => {
    if (metodoPrevio === "Mercado Pago") return "mercadopago";
    if (metodoPrevio === "PayPal")       return "paypal";
    if (metodoPrevio === "Efectivo")     return "efectivo";
    if (metodoPrevio === "Tarjeta")      return "tarjeta";
    return "tarjeta";
  })();

  const [tab, setTab]               = useState(defaultTab);
  const [procesando, setProcesando] = useState(false);
  const [error, setError]           = useState(null);
  const [mpAbierto, setMpAbierto]   = useState(false);
  const [ppListo, setPpListo]       = useState(false);
  const [mpBrickListo, setMpBrickListo] = useState(false);

  // Card form fields
  const [cardNum,  setCardNum]  = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExp,  setCardExp]  = useState("");
  const [cardCvv,  setCardCvv]  = useState("");

  const paypalRef      = useRef(null);
  const paypalRendered = useRef(false);
  const mpBrickRef     = useRef(null);
  const mpBrickMounted = useRef(false);

  const comision      = calcComision(parseFloat(monto));
  const montoPaseador = Math.round((parseFloat(monto) - comision) * 100) / 100;

  // ── Cargar MercadoPago JS SDK para el Brick de tarjeta ──────────────────────
  useEffect(() => {
    if (tab !== "tarjeta" || Platform.OS !== "web") return;
    if (document.getElementById("mp-sdk")) { intentarBrick(); return; }
    const s = document.createElement("script");
    s.id  = "mp-sdk";
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.onload = () => intentarBrick();
    document.body.appendChild(s);
  }, [tab]);

  const intentarBrick = () => {
    if (!MP_PUBLIC_KEY || !window.MercadoPago) { setMpBrickListo(false); return; }
    if (mpBrickMounted.current || !mpBrickRef.current) return;
    mpBrickMounted.current = true;
    setMpBrickListo(true);
    try {
      const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: "es-MX" });
      const builder = mp.bricks();
      builder.create("cardPayment", mpBrickRef.current, {
        initialization: { amount: parseFloat(monto) },
        customization:  { visual: { style: { theme: "default" } } },
        callbacks: {
          onReady:  () => {},
          onSubmit: async (formData) => {
            setProcesando(true);
            try {
              await apiFetch("/pago/tarjeta-mp", {
                method: "POST",
                body: JSON.stringify({ ...formData, servicio_id: servicioId, monto }),
              });
              irAlRecibo("Tarjeta (Mercado Pago)", `MP-${Date.now()}`);
            } catch (e) {
              setError(e.message || "Error procesando tarjeta");
              setProcesando(false);
            }
          },
          onError: (e) => setError("Error MP: " + (e.message || e)),
        },
      });
    } catch {
      setMpBrickListo(false);
    }
  };

  // ── Cargar PayPal SDK ────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== "paypal" || Platform.OS !== "web") return;
    const PPID = process.env.PAYPAL_CLIENT_ID || "sb";
    if (document.getElementById("paypal-sdk")) { setPpListo(true); return; }
    const s = document.createElement("script");
    s.id  = "paypal-sdk";
    s.src = `https://www.paypal.com/sdk/js?client-id=${PPID}&currency=MXN`;
    s.onload = () => setPpListo(true);
    document.body.appendChild(s);
  }, [tab]);

  useEffect(() => {
    if (!ppListo || tab !== "paypal" || paypalRendered.current) return;
    if (!window.paypal || !paypalRef.current) return;
    paypalRendered.current = true;
    window.paypal.Buttons({
      createOrder: async () => {
        const d = await apiFetch("/pago/paypal/order", {
          method: "POST",
          body: JSON.stringify({ monto, servicio_id: servicioId }),
        });
        return d.id;
      },
      onApprove: async (data) => {
        setProcesando(true);
        try {
          const cap = await apiFetch(`/pago/paypal/capture/${data.orderID}`, {
            method: "POST",
            body: JSON.stringify({ servicio_id: servicioId, monto }),
          });
          if (cap.status === "COMPLETED") irAlRecibo("PayPal", data.orderID);
        } catch (e) {
          setError(e.message || "Error PayPal");
          setProcesando(false);
        }
      },
      onError: (e) => setError("Error PayPal: " + e),
    }).render(paypalRef.current);
  }, [ppListo, tab]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const irAlRecibo = (metodoPago, referencia) => {
    navigation.replace("ReciboServicio", {
      servicioId, monto, metodoPago, referencia,
      tipoServicio, mascotaNombre, paseadorNombre, duracion,
      comision, montoPaseador,
    });
  };

  const registrarPago = async (metodoLabel, refExtra) => {
    setProcesando(true);
    setError(null);
    try {
      const d = await apiFetch("/pago/registrar", {
        method: "POST",
        body: JSON.stringify({ servicio_id: servicioId, metodo: metodoLabel, monto, referencia: refExtra }),
      });
      irAlRecibo(metodoLabel, d.referencia);
    } catch (e) {
      setError(e.message || "Error al procesar");
      setProcesando(false);
    }
  };

  const pagarMercadoPago = async () => {
    setProcesando(true);
    setError(null);
    try {
      const d = await apiFetch("/pago/mercadopago/preference", {
        method: "POST",
        body: JSON.stringify({
          servicio_id: servicioId, monto,
          descripcion: `${tipoServicio} GoDoggy${mascotaNombre ? " – " + mascotaNombre : ""}`,
        }),
      });
      const url = d.sandbox_init_point || d.init_point;
      if (url && typeof window !== "undefined") {
        window.open(url, "_blank");
        setMpAbierto(true);
      }
    } catch {
      setMpAbierto(true); // sin credenciales → mostrar confirmar manualmente
    } finally {
      setProcesando(false);
    }
  };

  const pagarTarjetaManual = async () => {
    if (!cardNum || !cardName || !cardExp || !cardCvv) {
      setError("Completa todos los campos"); return;
    }
    await registrarPago("Tarjeta", null);
  };

  const cambiarTab = (id) => {
    setTab(id);
    setError(null);
    setMpAbierto(false);
    paypalRendered.current = false;
    mpBrickMounted.current = false;
    setPpListo(false);
    setMpBrickListo(false);
  };

  const fmtCard = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp  = (v) => { const n = v.replace(/\D/g, "").slice(0, 4); return n.length >= 3 ? n.slice(0, 2) + "/" + n.slice(2) : n; };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTxt}>🐾 GoDoggy</Text>
        <Text style={s.headerSub}>Pago del servicio</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── RESUMEN DEL SERVICIO ─────────────────────────────────────────── */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Resumen del servicio</Text>
          <SRow label="Servicio"  value={tipoServicio} />
          {mascotaNombre  ? <SRow label="Mascota"   value={`🐶 ${mascotaNombre}`}  /> : null}
          {paseadorNombre ? <SRow label="Paseador"  value={`👤 ${paseadorNombre}`} /> : null}
          <SRow label="Duración" value={`${duracion} min`} />

          <View style={s.divider} />

          <SRow label="Subtotal del servicio" value={`$${parseFloat(monto).toFixed(2)}`} />
          <SRow label="Comisión plataforma (15%)" value={`$${comision.toFixed(2)}`} sub />
          <SRow label="El paseador recibe"    value={`$${montoPaseador.toFixed(2)}`} sub />

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total a pagar</Text>
            <Text style={s.totalVal}>${parseFloat(monto).toFixed(2)} MXN</Text>
          </View>
        </View>

        {/* ── TABS DE MÉTODO ──────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Método de pago</Text>
        <View style={s.tabs}>
          {METODOS.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[s.tab, tab === m.id && { borderColor: m.color, borderWidth: 2 }]}
              onPress={() => cambiarTab(m.id)}
              activeOpacity={0.75}
            >
              <Text style={s.tabIcon}>{m.icon}</Text>
              <Text style={[s.tabLabel, tab === m.id && { color: m.color, fontWeight: "700" }]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── PANEL ───────────────────────────────────────────────────────── */}
        <View style={s.panel}>

          {/* ── TARJETA (MP Bricks o formulario manual) ── */}
          {tab === "tarjeta" && (
            <View>
              <Text style={s.panelDesc}>
                Paga con tarjeta de crédito o débito de forma segura vía Mercado Pago.
              </Text>

              {/* MP Brick (si hay PUBLIC KEY configurada) */}
              {MP_PUBLIC_KEY ? (
                <View>
                  <View ref={mpBrickRef} style={{ minHeight: 200, marginTop: 8 }} />
                  {!mpBrickListo && <ActivityIndicator color={C.mp} style={{ marginVertical: 20 }} />}
                </View>
              ) : (
                /* Formulario manual de tarjeta (modo demo) */
                <View style={s.cardForm}>
                  <FLabel>Número de tarjeta</FLabel>
                  <TextInput style={s.input} value={cardNum} onChangeText={(v) => setCardNum(fmtCard(v))}
                    placeholder="1234 5678 9012 3456" keyboardType="numeric" maxLength={19} placeholderTextColor="#bbb" />
                  <FLabel>Nombre en la tarjeta</FLabel>
                  <TextInput style={s.input} value={cardName} onChangeText={setCardName}
                    placeholder="NOMBRE APELLIDO" autoCapitalize="characters" placeholderTextColor="#bbb" />
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <FLabel>Vencimiento</FLabel>
                      <TextInput style={s.input} value={cardExp} onChangeText={(v) => setCardExp(fmtExp(v))}
                        placeholder="MM/AA" keyboardType="numeric" maxLength={5} placeholderTextColor="#bbb" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <FLabel>CVV</FLabel>
                      <TextInput style={s.input} value={cardCvv}
                        onChangeText={(v) => setCardCvv(v.replace(/\D/g, "").slice(0, 4))}
                        placeholder="123" keyboardType="numeric" maxLength={4} secureTextEntry placeholderTextColor="#bbb" />
                    </View>
                  </View>
                  <TouchableOpacity style={[s.payBtn, { backgroundColor: "#333", marginTop: 14 }]}
                    onPress={pagarTarjetaManual} disabled={procesando}>
                    {procesando ? <ActivityIndicator color="#fff" /> : <Text style={s.payBtnTxt}>💳 Pagar ${parseFloat(monto).toFixed(2)} MXN</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* ── MERCADO PAGO (Checkout Pro) ── */}
          {tab === "mercadopago" && (
            <View>
              <Text style={s.panelDesc}>
                Se abrirá la página de Mercado Pago en una nueva pestaña para completar el pago de forma segura con tu cuenta MP o cualquier tarjeta.
              </Text>
              {!mpAbierto ? (
                <TouchableOpacity style={[s.payBtn, { backgroundColor: C.mp }]}
                  onPress={pagarMercadoPago} disabled={procesando}>
                  {procesando ? <ActivityIndicator color="#fff" /> : <Text style={s.payBtnTxt}>💙 Pagar con Mercado Pago</Text>}
                </TouchableOpacity>
              ) : (
                <View>
                  <Text style={[s.panelDesc, { color: C.green, fontWeight: "600" }]}>
                    Se abrió Mercado Pago en otra pestaña. Confirma aquí una vez que completes el pago.
                  </Text>
                  <TouchableOpacity style={[s.payBtn, { backgroundColor: C.green }]}
                    onPress={() => registrarPago("Mercado Pago", null)} disabled={procesando}>
                    {procesando ? <ActivityIndicator color="#fff" /> : <Text style={s.payBtnTxt}>✓ Confirmar pago realizado</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* ── PAYPAL ── */}
          {tab === "paypal" && (
            <View>
              <Text style={s.panelDesc}>
                Paga con tu saldo PayPal, tarjeta vinculada o cuenta bancaria.
              </Text>
              {!ppListo && <ActivityIndicator color={C.pp} style={{ marginVertical: 20 }} />}
              <View ref={paypalRef} style={{ minHeight: 50, marginTop: 8 }} />
              {ppListo && (
                <TouchableOpacity style={[s.payBtn, { backgroundColor: "#FFD140", marginTop: 12 }]}
                  onPress={() => registrarPago("PayPal", null)} disabled={procesando}>
                  {procesando ? <ActivityIndicator color="#333" /> : <Text style={[s.payBtnTxt, { color: "#333" }]}>🅿️ Confirmar pago PayPal</Text>}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── EFECTIVO ── */}
          {tab === "efectivo" && (
            <View>
              <Text style={s.panelDesc}>
                Paga directamente al paseador en efectivo al final del servicio. Sin cargos adicionales.
              </Text>
              <View style={s.efectivoBox}>
                <Text style={s.efectivoAmount}>${parseFloat(monto).toFixed(2)} MXN</Text>
                <Text style={s.efectivoSub}>Ten este monto listo para entregarlo al paseador</Text>
              </View>
              <TouchableOpacity style={[s.payBtn, { backgroundColor: "#5A8A5A" }]}
                onPress={() => registrarPago("Efectivo", null)} disabled={procesando}>
                {procesando ? <ActivityIndicator color="#fff" /> : <Text style={s.payBtnTxt}>💵 Confirmar pago en efectivo</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ERROR */}
          {error ? <View style={s.errorBox}><Text style={s.errorTxt}>⚠️ {error}</Text></View> : null}
        </View>

        {/* SIMULACIÓN (visible solo si no hay credenciales reales) */}
        {!MP_PUBLIC_KEY && tab !== "efectivo" && (
          <TouchableOpacity style={s.demoBtn}
            onPress={() => registrarPago(METODOS.find(m => m.id === tab)?.label || tab, null)}
            disabled={procesando}>
            <Text style={s.demoBtnTxt}>🧪 Simular pago exitoso (modo demo)</Text>
          </TouchableOpacity>
        )}

        <Text style={s.secureNote}>🔒 Pago seguro · Datos protegidos · GoDoggy</Text>
      </ScrollView>
    </View>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────
function SRow({ label, value, sub }) {
  return (
    <View style={s.sumRow}>
      <Text style={[s.sumLabel, sub && { color: "#aaa", fontSize: 12 }]}>{label}</Text>
      <Text style={[s.sumVal,   sub && { color: "#aaa", fontSize: 12 }]}>{value}</Text>
    </View>
  );
}
function FLabel({ children }) {
  return <Text style={s.fieldLabel}>{children}</Text>;
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg, height: "100vh" },
  header: { backgroundColor: C.dark, paddingTop: 50, paddingBottom: 18, paddingHorizontal: 20, alignItems: "center" },
  backBtn:{ position: "absolute", left: 16, top: 50, padding: 6 },
  backTxt:{ color: "#fff", fontSize: 26, fontWeight: "300" },
  headerTxt: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: C.teal, fontSize: 13, marginTop: 3 },

  scroll: { padding: 16, paddingBottom: 44 },

  summaryCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 18, marginBottom: 22,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  summaryTitle: { fontSize: 12, fontWeight: "700", color: C.sub, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 },
  divider:      { height: 1, backgroundColor: C.border, marginVertical: 10 },
  sumRow:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  sumLabel:{ color: C.sub, fontSize: 13 },
  sumVal:  { color: C.text, fontSize: 13, fontWeight: "600" },
  totalRow:{ flexDirection: "row", justifyContent: "space-between", backgroundColor: "#EDF9F4", borderRadius: 10, padding: 12, marginTop: 10 },
  totalLabel: { fontSize: 14, fontWeight: "700", color: C.dark },
  totalVal:   { fontSize: 20, fontWeight: "900", color: C.green },

  sectionTitle: { fontSize: 12, fontWeight: "700", color: C.sub, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  tab:  {
    flex: 1, minWidth: 70, backgroundColor: C.card, borderRadius: 12, padding: 12,
    alignItems: "center", borderWidth: 2, borderColor: "transparent",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  tabIcon:  { fontSize: 22, marginBottom: 5 },
  tabLabel: { fontSize: 10, color: C.sub, textAlign: "center" },

  panel: {
    backgroundColor: C.card, borderRadius: 16, padding: 18, marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 5, elevation: 1,
  },
  panelDesc: { color: C.sub, fontSize: 13, lineHeight: 20, marginBottom: 14 },

  cardForm: { gap: 2 },
  fieldLabel:{ fontSize: 12, color: C.sub, marginTop: 10, marginBottom: 4, fontWeight: "600" },
  input: { backgroundColor: "#f4f4f4", borderRadius: 10, padding: 13, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border },

  payBtn:    { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  payBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },

  efectivoBox: { backgroundColor: "#EDF9F4", borderRadius: 14, padding: 20, alignItems: "center", marginBottom: 16 },
  efectivoAmount: { fontSize: 32, fontWeight: "900", color: C.green },
  efectivoSub:    { fontSize: 13, color: C.sub, marginTop: 6, textAlign: "center" },

  errorBox: { backgroundColor: "#FEE8E8", borderRadius: 10, padding: 12, marginTop: 14 },
  errorTxt: { color: "#c0392b", fontSize: 13 },

  demoBtn:    { backgroundColor: "#f0f0f0", borderRadius: 14, paddingVertical: 13, alignItems: "center", marginBottom: 12 },
  demoBtnTxt: { color: "#888", fontSize: 13, fontWeight: "600" },

  secureNote: { textAlign: "center", color: "#bbb", fontSize: 11 },
});
