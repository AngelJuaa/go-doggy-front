import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { s, vs, ms } from "../../../utils/responsive";
import { API_URL } from "../../../utils/api";
import storage from "../../../utils/storage";
import { BottomTab } from "./GananciasDetalle";

const BG = "#F2EDD8";

export default function EstrellasDetalle({ navigation }) {
  const [calificacion, setCalificacion] = useState({ total: 0, resenas: 0, categorias: {} });
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    let perfil = {};
    try {
      perfil = JSON.parse(storage.getItem("paseador") || "{}");
    } catch (error) {
      perfil = {};
    }
    const paseadorId = Number(perfil.paseador_id || perfil.usuario_id || perfil.id || 0);
    if (!paseadorId) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/paseador/${paseadorId}/calificaciones`)
      .then((response) => response.ok ? response.json() : [])
      .then((resenas) => {
        const lista = Array.isArray(resenas) ? resenas : [];
        const promedios = lista.map((resena) => Number(resena.promedio) || 0).filter(Boolean);
        const categorias = {};
        const conteos = {};
        lista.forEach((resena) => {
          Object.entries(resena.categorias || {}).forEach(([categoria, valor]) => {
            const numero = Number(valor);
            if (!Number.isFinite(numero)) return;
            categorias[categoria] = (categorias[categoria] || 0) + numero;
            conteos[categoria] = (conteos[categoria] || 0) + 1;
          });
        });
        Object.keys(categorias).forEach((categoria) => {
          categorias[categoria] = conteos[categoria] ? categorias[categoria] / conteos[categoria] : 0;
        });
        setCalificacion({
          total: promedios.length ? promedios.reduce((sum, value) => sum + value, 0) / promedios.length : 0,
          resenas: lista.length,
          categorias,
        });
      })
      .catch(() => setCalificacion({ total: 0, resenas: 0, categorias: {} }))
      .finally(() => setLoading(false));
  }, []);

  const mensaje = calificacion.total >= 4.5
    ? "Excelente trabajo, nunca cambies"
    : calificacion.total >= 4
    ? "Vas excelente pero puedes ir mejor"
    : calificacion.total >= 3.5
    ? "Es algo bajo pero puedes mejorar"
    : "Santa cachucha, estás grave, debes mejorar";
  const categorias = ["General", "Eficiente", "Amabilidad", "Confianza", "Comunicacion"];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>↩</Text>
      </TouchableOpacity>

      <View style={styles.headerCard}>
        <Text style={styles.emoji}>⭐</Text>
        <Text style={styles.headerTitle}>Calificaciones</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#F5C518" style={{marginTop:vs(40)}} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Calificación total</Text>
            <View style={styles.totalCard}>
              <Text style={styles.totalValue}>{calificacion.total ? calificacion.total.toFixed(1) : "0.0"}</Text>
              <Text style={styles.totalStars}>{"★".repeat(Math.round(calificacion.total))}<Text style={styles.emptyStars}>{"★".repeat(Math.max(0, 5 - Math.round(calificacion.total)))}</Text></Text>
              <Text style={styles.reviewCount}>{calificacion.resenas} reseña{calificacion.resenas === 1 ? "" : "s"}</Text>
            </View>
            <Text style={styles.message}>{mensaje}</Text>
            <Text style={styles.categoryTitle}>Promedio por categoría</Text>
            {categorias.map((categoria) => {
              const promedio = Number(calificacion.categorias[categoria]) || 0;
              return (
                <View key={categoria} style={styles.categoryRow}>
                  <Text style={styles.categoryName}>{categoria}</Text>
                  <Text style={styles.categoryStars}>{"★".repeat(Math.round(promedio))}<Text style={styles.emptyStars}>{"★".repeat(Math.max(0, 5 - Math.round(promedio)))}</Text></Text>
                  <Text style={styles.categoryValue}>{promedio.toFixed(1)}</Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <BottomTab navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex:1, backgroundColor:BG },
  backBtn:     { position:"absolute", top:vs(48), right:s(20), zIndex:10, padding:s(6) },
  backIcon:    { fontSize:ms(22), color:"#1A1A1A" },
  headerCard:  { flexDirection:"row", alignItems:"center", gap:s(12),
                 backgroundColor:"#E8DFBF", marginTop:vs(80), marginHorizontal:s(20),
                 borderRadius:s(14), paddingVertical:vs(16), paddingHorizontal:s(20),
                 elevation:2, shadowColor:"#000", shadowOpacity:0.06, shadowRadius:6, shadowOffset:{width:0,height:3} },
  emoji:        { fontSize:ms(32) },
  headerTitle:  { fontSize:ms(22), fontFamily:"serif", fontWeight:"600", color:"#1A1A1A" },
  body:         { flex:1, paddingHorizontal:s(20), paddingTop:vs(20) },
  bodyContent:  { paddingBottom:vs(100) },
  sectionTitle: { fontSize:ms(18), fontWeight:"800", color:"#1A1A1A", textAlign:"center", marginBottom:vs(16) },
  totalCard:    { backgroundColor:"#fff", borderRadius:s(16), paddingVertical:vs(18), alignItems:"center", elevation:3, marginBottom:vs(14) },
  totalValue:   { fontSize:ms(38), fontWeight:"800", color:"#1A1A1A" },
  totalStars:   { fontSize:ms(27), color:"#F5C518", letterSpacing: 1 },
  emptyStars:   { color:"#D8D8D8" },
  reviewCount:  { fontSize:ms(12), color:"#777", marginTop:vs(5) },
  message:      { backgroundColor:"#99D9C1", borderRadius:s(12), padding:s(14), color:"#1A1A1A", fontSize:ms(14), fontWeight:"700", textAlign:"center", marginBottom:vs(20) },
  categoryTitle:{ fontSize:ms(17), fontWeight:"800", color:"#1A1A1A", marginBottom:vs(10) },
  categoryRow:  { flexDirection:"row", alignItems:"center", backgroundColor:"#fff", borderRadius:s(10), padding:s(12), marginBottom:vs(8), elevation:1 },
  categoryName: { flex:1, fontSize:ms(14), fontWeight:"700", color:"#333" },
  categoryStars:{ fontSize:ms(16), color:"#F5C518" },
  categoryValue:{ width:s(30), textAlign:"right", fontSize:ms(13), fontWeight:"800", color:"#555" },
});
