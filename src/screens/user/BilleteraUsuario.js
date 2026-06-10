import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { s, vs, ms } from "../../utils/responsive";

export default function BilleteraUsuario({ navigation }) {
  const movimientos = [
    { id: 1, concepto: "Paseo - Kronos", monto: "-$150.00", fecha: "17 Dic 2025", tipo: "gasto" },
    { id: 2, concepto: "Recarga de saldo", monto: "+$500.00", fecha: "15 Dic 2025", tipo: "ingreso" },
    { id: 3, concepto: "Paseo - Garfield", monto: "-$120.00", fecha: "12 Dic 2025", tipo: "gasto" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>💼</Text>
        <View style={styles.titleBox}>
          <Text style={styles.titleText}>Billetera</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>↩</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.saldoCard}>
          <Text style={styles.saldoLabel}>Saldo disponible</Text>
          <Text style={styles.saldoValue}>$230.00</Text>
          <TouchableOpacity style={styles.recargarBtn} onPress={() => Alert.alert("Recargar", "Función de recarga próximamente.")}>
            <Text style={styles.recargarText}>+ Recargar saldo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Movimientos recientes</Text>
        {movimientos.map((m) => (
          <View key={m.id} style={styles.movCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.movConcepto}>{m.concepto}</Text>
              <Text style={styles.movFecha}>{m.fecha}</Text>
            </View>
            <Text style={[styles.movMonto, { color: m.tipo === "ingreso" ? "#28a745" : "#dc3545" }]}>{m.monto}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  headerRow: { flexDirection: "row", alignItems: "center", padding: s(18), paddingTop: vs(50) },
  icon: { fontSize: ms(26), marginRight: s(12) },
  titleBox: { backgroundColor: "#FFF9E6", paddingHorizontal: s(22), paddingVertical: vs(7), borderRadius: s(20), flex: 1 },
  titleText: { fontSize: ms(19), fontWeight: "bold" },
  back: { fontSize: ms(26), marginLeft: s(12) },
  content: { padding: s(16) },
  saldoCard: { backgroundColor: "#99D9C1", borderRadius: s(20), padding: s(24), alignItems: "center", marginBottom: vs(20) },
  saldoLabel: { fontSize: ms(14), color: "#fff", fontWeight: "600" },
  saldoValue: { fontSize: ms(38), color: "#fff", fontWeight: "bold", marginVertical: vs(8) },
  recargarBtn: { backgroundColor: "#fff", borderRadius: s(20), paddingHorizontal: s(20), paddingVertical: vs(8), marginTop: vs(8) },
  recargarText: { color: "#99D9C1", fontWeight: "bold", fontSize: ms(13) },
  sectionTitle: { fontSize: ms(15), fontWeight: "bold", color: "#333", marginBottom: vs(10) },
  movCard: { flexDirection: "row", backgroundColor: "#fff", borderRadius: s(12), padding: s(14), marginBottom: vs(10), alignItems: "center", elevation: 1 },
  movConcepto: { fontSize: ms(14), fontWeight: "600", color: "#333" },
  movFecha: { fontSize: ms(11), color: "#aaa", marginTop: vs(2) },
  movMonto: { fontSize: ms(15), fontWeight: "bold" },
});
