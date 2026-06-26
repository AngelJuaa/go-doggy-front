import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { s, vs, ms } from "../../../utils/responsive";
import storage from "../../../utils/storage";
import { apiFetch } from "../../../utils/api";

const BG = "#F2EDD8";

function semanaLabel() {
  const now   = new Date();
  const start = new Date(now); start.setDate(now.getDate() - 6);
  const fmt   = (d) => `${d.getDate()}-${d.toLocaleString("es-MX",{month:"long"})}-${d.getFullYear()}`;
  return `Fecha : ${fmt(start)} a ${fmt(now)}`;
}

export default function GananciasDetalle({ navigation }) {
  const [total, setTotal]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = JSON.parse(storage.getItem("usuario") || "{}");
    if (u.usuario_id) {
      apiFetch(`/ganancias/${u.usuario_id}`)
        .then(d => setTotal(parseFloat(d.total_ganado || 0)))
        .catch(() => setTotal(0))
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  // Generar datos demo proporcionales al total real
  const dailyData = useMemo(() => {
    const base = total || 300;
    const factors = [0.10, 0.14, 0.12, 0.18, 0.20, 0.14, 0.12];
    return factors.map(f => Math.round(base * f));
  }, [total]);

  const chartHtml = useMemo(() => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    html,body{margin:0;padding:8px;background:transparent;box-sizing:border-box;}
    canvas{width:100%!important;}
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script>
    const daily  = ${JSON.stringify(dailyData)};
    const avg    = Array(daily.length).fill(Math.round(daily.reduce((a,b)=>a+b,0)/daily.length));
    new Chart(document.getElementById('c'), {
      type: 'line',
      data: {
        labels: ['MON','TUE','WED','THU','FRI','SAT','SUN'],
        datasets: [
          { label:'Daily',   data: daily, borderColor:'#4DD9C0', backgroundColor:'rgba(77,217,192,0.12)',
            tension:0.35, pointRadius:5, pointBackgroundColor:'#4DD9C0', borderWidth:2.5 },
          { label:'Average', data: avg,   borderColor:'#E07070', backgroundColor:'rgba(224,112,112,0.06)',
            tension:0, pointRadius:0, borderWidth:2, borderDash:[6,4] }
        ]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ position:'top', labels:{font:{size:11}} } },
        scales:{
          y:{ beginAtZero:true, ticks:{callback:v=>'$'+v, font:{size:10}} },
          x:{ ticks:{font:{size:10}} }
        }
      }
    });
  </script>
</body>
</html>`, [dailyData]);

  const moneda = (v) => `$${parseFloat(v||0).toLocaleString("es-MX",{minimumFractionDigits:2})}`;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>↩</Text>
      </TouchableOpacity>

      <View style={styles.headerCard}>
        <Text style={styles.emoji}>💰</Text>
        <Text style={styles.headerTitle}>Ganancias</Text>
      </View>

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator size="large" color="#4DD9C0" style={{marginTop: vs(40)}} />
        ) : (
          <>
            <Text style={styles.totalLabel}>Ganancia semanal {moneda(total)}</Text>
            <Text style={styles.fechaLabel}>{semanaLabel()}</Text>
            <View style={styles.chartBox}>
              {Platform.OS === "web" ? (
                <iframe title="ganancias-chart" srcDoc={chartHtml} sandbox="allow-scripts"
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

export function BottomTab({ navigation }) {
  return (
    <View style={tabStyles.bar}>
      {[["🏠","Inicio","Inicio_paseador"],["✅","Paseos","PaseosPaseador"],
        ["🔔","Notificaciones","NotificacionesPaseador"],["👤","Perfil","PerfilPaseador"]
      ].map(([icon,label,route]) => (
        <TouchableOpacity key={route} style={tabStyles.item}
          onPress={() => navigation.navigate(route)}>
          <Text style={tabStyles.icon}>{icon}</Text>
          <Text style={tabStyles.label}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  bar:   { flexDirection:"row", backgroundColor:"#99D9C1", height:vs(65), justifyContent:"space-around", alignItems:"center" },
  item:  { alignItems:"center" },
  icon:  { fontSize:ms(20) },
  label: { fontSize:ms(10), fontWeight:"bold", color:"#1A1A1A" },
});

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:BG },
  backBtn:   { position:"absolute", top:vs(48), right:s(20), zIndex:10, padding:s(6) },
  backIcon:  { fontSize:ms(22), color:"#1A1A1A" },
  headerCard:{ flexDirection:"row", alignItems:"center", gap:s(12),
               backgroundColor:"#E8DFBF", marginTop:vs(80), marginHorizontal:s(20),
               borderRadius:s(14), paddingVertical:vs(16), paddingHorizontal:s(20),
               elevation:2, shadowColor:"#000", shadowOpacity:0.06, shadowRadius:6, shadowOffset:{width:0,height:3} },
  emoji:       { fontSize:ms(32) },
  headerTitle: { fontSize:ms(24), fontFamily:"serif", fontWeight:"600", color:"#1A1A1A" },
  body:        { flex:1, paddingHorizontal:s(20), paddingTop:vs(18) },
  totalLabel:  { fontSize:ms(18), fontWeight:"800", color:"#1A1A1A", marginBottom:vs(4) },
  fechaLabel:  { fontSize:ms(11), color:"#666", marginBottom:vs(14) },
  chartBox:    { flex:1, borderRadius:s(12), overflow:"hidden", backgroundColor:"#fff",
                 elevation:2, shadowColor:"#000", shadowOpacity:0.06, shadowRadius:6, shadowOffset:{width:0,height:3} },
  noChart:     { textAlign:"center", color:"#999", marginTop:vs(40) },
});
