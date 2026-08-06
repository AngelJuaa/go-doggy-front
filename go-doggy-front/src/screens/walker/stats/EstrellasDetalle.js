import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { s, vs, ms } from "../../../utils/responsive";
import storage from "../../../utils/storage";
import { apiFetch } from "../../../utils/api";
import { BottomTab } from "./GananciasDetalle";

const BG = "#F2EDD8";

export default function EstrellasDetalle({ navigation }) {
  const [estrellas, setEstrellas] = useState({ total: 0, max: 0, pct: 0 });
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const u = JSON.parse(storage.getItem("usuario") || "{}");
    if (u.usuario_id) {
      apiFetch(`/ganancias/${u.usuario_id}`)
        .then(d => {
          const total = parseInt(d.total_estrellas || 0);
          const max   = parseInt(d.max_estrellas   || 0) || 200; // fallback a 200
          const pct   = max > 0 ? ((total / max) * 100).toFixed(1) : 0;
          setEstrellas({ total, max, pct });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const chartHtml = useMemo(() => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    html,body{margin:0;padding:16px;background:#fff;
      display:flex;align-items:center;justify-content:center;
      flex-direction:column;box-sizing:border-box;height:100vh;}
    .label{font-family:sans-serif;font-size:13px;color:#555;margin-bottom:12px;text-align:center;}
    .center{position:relative;width:200px;height:200px;}
    canvas{position:absolute;top:0;left:0;}
    .info{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      text-align:center;pointer-events:none;}
    .fraction{font-size:20px;font-weight:800;color:#F5C518;font-family:sans-serif;}
    .pctTxt{font-size:13px;color:#888;font-family:sans-serif;}
  </style>
</head>
<body>
  <div class="label">Progreso de Estrellas Obtenidas</div>
  <div class="center">
    <canvas id="c" width="200" height="200"></canvas>
    <div class="info">
      <div class="fraction">${estrellas.total}/${estrellas.max}</div>
      <div class="pctTxt">(${estrellas.pct}%)</div>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script>
    const pct   = ${estrellas.pct};
    const rest  = 100 - pct;
    new Chart(document.getElementById('c'), {
      type: 'doughnut',
      data: {
        datasets:[{
          data: [pct, rest],
          backgroundColor: ['#F5C518', '#E0E0E0'],
          borderWidth: 0,
          borderRadius: 8,
        }]
      },
      options:{
        cutout: '72%',
        responsive: false,
        plugins:{ legend:{display:false}, tooltip:{enabled:false} },
        animation:{ animateRotate:true, duration:800 }
      }
    });
  </script>
</body>
</html>`, [estrellas]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>↩</Text>
      </TouchableOpacity>

      <View style={styles.headerCard}>
        <Text style={styles.emoji}>⭐</Text>
        <Text style={styles.headerTitle}>Calificaciones</Text>
      </View>

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator size="large" color="#F5C518" style={{marginTop:vs(40)}} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Calificacion personal</Text>

            <View style={styles.chartCard}>
              {Platform.OS === "web" ? (
                <iframe title="estrellas-chart" srcDoc={chartHtml} sandbox="allow-scripts"
                  style={{width:"100%",height:"100%",border:"none"}} />
              ) : (
                <View style={styles.fallback}>
                  <Text style={styles.fallbackFrac}>{estrellas.total}/{estrellas.max}</Text>
                  <Text style={styles.fallbackPct}>({estrellas.pct}%)</Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>

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
  sectionTitle: { fontSize:ms(18), fontWeight:"800", color:"#1A1A1A", textAlign:"center", marginBottom:vs(16) },
  chartCard:    { flex:1, backgroundColor:"#fff", borderRadius:s(16), overflow:"hidden",
                  elevation:3, shadowColor:"#000", shadowOpacity:0.08, shadowRadius:8, shadowOffset:{width:0,height:4},
                  marginBottom:vs(10) },
  fallback:     { flex:1, alignItems:"center", justifyContent:"center" },
  fallbackFrac: { fontSize:ms(32), fontWeight:"800", color:"#F5C518" },
  fallbackPct:  { fontSize:ms(16), color:"#888", marginTop:vs(4) },
});
