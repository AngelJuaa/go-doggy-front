import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { s, vs, ms } from "../../../utils/responsive";
import storage from "../../../utils/storage";
import { apiFetch } from "../../../utils/api";
import { BottomTab } from "./GananciasDetalle";

const BG = "#F2EDD8";

function semanaLabel() {
  const now   = new Date();
  const start = new Date(now); start.setDate(now.getDate() - 6);
  const fmt   = (d) => `${d.getDate()}-${d.toLocaleString("es-MX",{month:"long"})}-${d.getFullYear()}`;
  return `Fecha : ${fmt(start)} a ${fmt(now)}`;
}

export default function ConectadoDetalle({ navigation }) {
  const [horas, setHoras]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = JSON.parse(storage.getItem("usuario") || "{}");
    if (u.usuario_id) {
      apiFetch(`/ganancias/${u.usuario_id}`)
        .then(d => setHoras(d.horas_conectado || 0))
        .catch(() => setHoras(0))
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  // Datos demo de horas por día (distribución realista)
  const dailyHours = [4.1, 3.5, 7.5, 8.2, 10.5, 0.9, 3.0];

  const chartHtml = useMemo(() => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    html,body{margin:0;padding:0;background:#1A2035;}
    .wrap{padding:12px;height:100vh;box-sizing:border-box;}
    canvas{width:100%!important;}
  </style>
</head>
<body>
  <div class="wrap">
    <canvas id="c"></canvas>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script>
    const days  = ['Lunes','Martes','Mie','Jueves','Vie','Sab','Dom'];
    const hours = ${JSON.stringify(dailyHours)};
    const ctx   = document.getElementById('c');
    const grad  = ctx.getContext('2d').createLinearGradient(0,0,0,300);
    grad.addColorStop(0, 'rgba(0,230,220,0.4)');
    grad.addColorStop(1, 'rgba(0,230,220,0.0)');
    new Chart(ctx, {
      type:'line',
      data:{
        labels: days,
        datasets:[{
          label:'Horas',
          data: hours,
          borderColor:'#00E6DC',
          backgroundColor: grad,
          tension:0.4,
          pointRadius:5,
          pointBackgroundColor:'#FF6B8A',
          pointBorderColor:'#fff',
          pointBorderWidth:2,
          borderWidth:2.5,
          fill:true
        }]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false},
          datalabels:{display:false}
        },
        scales:{
          y:{ beginAtZero:true, max:12,
              grid:{color:'rgba(255,255,255,0.1)'},
              ticks:{color:'#aaa', callback:v=>v+'h', font:{size:10}} },
          x:{ grid:{color:'rgba(255,255,255,0.08)'},
              ticks:{color:'#aaa', font:{size:9}} }
        }
      }
    });
  </script>
</body>
</html>`, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>↩</Text>
      </TouchableOpacity>

      <View style={styles.headerCard}>
        <Text style={styles.emoji}>🕐</Text>
        <Text style={styles.headerTitle}>Tiempo conectado</Text>
      </View>

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator size="large" color="#00E6DC" style={{marginTop:vs(40)}} />
        ) : (
          <>
            <View style={styles.statRow}>
              <Text style={styles.statKey}>Tiempo Conectado</Text>
              <Text style={styles.statVal}>{horas}h</Text>
            </View>
            <Text style={styles.fechaLabel}>{semanaLabel()}</Text>

            <View style={styles.chartBox}>
              {Platform.OS === "web" ? (
                <iframe title="conectado-chart" srcDoc={chartHtml} sandbox="allow-scripts"
                  style={{width:"100%",height:"100%",border:"none"}} />
              ) : (
                <Text style={styles.noChart}>Gráfica disponible en web</Text>
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
  container:  { flex:1, backgroundColor:BG },
  backBtn:    { position:"absolute", top:vs(48), right:s(20), zIndex:10, padding:s(6) },
  backIcon:   { fontSize:ms(22), color:"#1A1A1A" },
  headerCard: { flexDirection:"row", alignItems:"center", gap:s(12),
                backgroundColor:"#E8DFBF", marginTop:vs(80), marginHorizontal:s(20),
                borderRadius:s(14), paddingVertical:vs(16), paddingHorizontal:s(20),
                elevation:2, shadowColor:"#000", shadowOpacity:0.06, shadowRadius:6, shadowOffset:{width:0,height:3} },
  emoji:       { fontSize:ms(32) },
  headerTitle: { fontSize:ms(22), fontFamily:"serif", fontWeight:"600", color:"#1A1A1A" },
  body:        { flex:1, paddingHorizontal:s(20), paddingTop:vs(18) },
  statRow:     { flexDirection:"row", justifyContent:"space-between", alignItems:"baseline", marginBottom:vs(4) },
  statKey:     { fontSize:ms(17), fontWeight:"800", color:"#1A1A1A" },
  statVal:     { fontSize:ms(17), fontWeight:"800", color:"#1A1A1A" },
  fechaLabel:  { fontSize:ms(11), color:"#666", marginBottom:vs(14) },
  chartBox:    { flex:1, borderRadius:s(12), overflow:"hidden", backgroundColor:"#1A2035",
                 elevation:3, shadowColor:"#000", shadowOpacity:0.12, shadowRadius:8, shadowOffset:{width:0,height:4} },
  noChart:     { textAlign:"center", color:"#aaa", marginTop:vs(40) },
});
