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

export default function PaseosDetalle({ navigation }) {
  const [totalPaseos, setTotalPaseos] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const u = JSON.parse(storage.getItem("usuario") || "{}");
    if (u.usuario_id) {
      apiFetch(`/ganancias/${u.usuario_id}`)
        .then(d => setTotalPaseos(parseInt(d.total_paseos || 0)))
        .catch(() => setTotalPaseos(0))
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  // Distribución horaria de paseos (demo)
  const hourlyData = [
    { hora: "7:00",  val: 1 },
    { hora: "9:00",  val: 2 },
    { hora: "10:00", val: 2 },
    { hora: "11:00", val: 3 },
    { hora: "12:00", val: 0 },
    { hora: "13:00", val: 1 },
    { hora: "14:00", val: 3 },
  ];

  const chartHtml = useMemo(() => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    html,body{margin:0;padding:10px;background:transparent;box-sizing:border-box;}
    canvas{width:100%!important;}
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script>
    const labels = ${JSON.stringify(hourlyData.map(h => h.hora))};
    const values = ${JSON.stringify(hourlyData.map(h => h.val))};
    const ctx = document.getElementById('c');

    // Gradient per bar (blue → purple → green)
    const colors = values.map((_, i) => {
      const pct = i / (values.length - 1);
      const r = Math.round(66  + (0   - 66 ) * pct);
      const g = Math.round(133 + (200 - 133) * pct);
      const b = Math.round(244 + (100 - 244) * pct);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    });

    new Chart(ctx, {
      type:'bar',
      data:{
        labels,
        datasets:[{
          label:'Paseos',
          data: values,
          backgroundColor: colors,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          datalabels:{display:false}
        },
        scales:{
          y:{ beginAtZero:true, stepSize:1, max:4,
              ticks:{stepSize:1, font:{size:10}},
              title:{display:true, text:'Paseos', font:{size:11}, color:'#555'} },
          x:{ ticks:{font:{size:9}} }
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
        <Text style={styles.emoji}>🐕</Text>
        <Text style={styles.headerTitle}>Paseos</Text>
      </View>

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator size="large" color="#42A5F5" style={{marginTop:vs(40)}} />
        ) : (
          <>
            <View style={styles.statRow}>
              <Text style={styles.statKey}>Paseos</Text>
              <Text style={styles.statVal}>{totalPaseos} p</Text>
            </View>
            <Text style={styles.fechaLabel}>{semanaLabel()}</Text>

            <View style={styles.chartBox}>
              {Platform.OS === "web" ? (
                <iframe title="paseos-chart" srcDoc={chartHtml} sandbox="allow-scripts"
                  style={{width:"100%",height:"100%",border:"none",background:"transparent"}} />
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
  headerTitle: { fontSize:ms(24), fontFamily:"serif", fontWeight:"600", color:"#1A1A1A" },
  body:        { flex:1, paddingHorizontal:s(20), paddingTop:vs(18) },
  statRow:     { flexDirection:"row", justifyContent:"space-between", alignItems:"baseline", marginBottom:vs(4) },
  statKey:     { fontSize:ms(18), fontWeight:"800", color:"#1A1A1A" },
  statVal:     { fontSize:ms(18), fontWeight:"800", color:"#1A1A1A" },
  fechaLabel:  { fontSize:ms(11), color:"#666", marginBottom:vs(14) },
  chartBox:    { flex:1, borderRadius:s(12), overflow:"hidden", backgroundColor:"#fff",
                 elevation:2, shadowColor:"#000", shadowOpacity:0.06, shadowRadius:6, shadowOffset:{width:0,height:3} },
  noChart:     { textAlign:"center", color:"#999", marginTop:vs(40) },
});
