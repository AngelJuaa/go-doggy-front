import React, { useRef, useMemo, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

const DEFAULT = [19.4326, -99.1332];

// Mapa nativo basado en WebView + Leaflet + OpenStreetMap.
// Esto FUNCIONA en Expo Go (no necesita API key de Google Maps).
// Las actualizaciones de posición se inyectan en tiempo real sin recargar.
function buildHtml(center) {
  const c = center && center.length === 2 ? center : DEFAULT;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #aadaff; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${c[0]}, ${c[1]}], 16);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    var markerLayer = L.layerGroup().addTo(map);
    var routeLine = null;
    var firstCenter = true;

    var walkerIcon = L.divIcon({
      html: '<div style="font-size:30px;line-height:30px;">🐕</div>',
      className: '', iconSize: [30, 30], iconAnchor: [15, 15]
    });

    window.__setData = function (data) {
      try {
        markerLayer.clearLayers();
        (data.markers || []).forEach(function (m) {
          L.marker(m.position, { icon: walkerIcon }).addTo(markerLayer);
        });
        if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
        if (data.route && data.route.length > 1) {
          routeLine = L.polyline(data.route, { color: '#34c759', weight: 5 }).addTo(map);
        }
        if (data.center && data.center.length === 2) {
          map.setView(data.center, map.getZoom(), { animate: !firstCenter });
          firstCenter = false;
        }
        // Forzar recálculo del tamaño (a veces el WebView mide mal al inicio)
        setTimeout(function () { map.invalidateSize(); }, 80);
      } catch (e) {}
    };
  </script>
</body>
</html>`;
}

export default function LiveMap({ center, markers = [], route = [] }) {
  const webRef = useRef(null);
  // El HTML base se construye UNA sola vez (no se recarga en cada update).
  const html = useMemo(() => buildHtml(center), []);

  const dataStr = JSON.stringify({ center, markers, route });

  // Empuja los datos al WebView SIN recargar la página (tiempo real).
  const pushData = () => {
    if (webRef.current) {
      webRef.current.injectJavaScript(
        "window.__setData && window.__setData(" + dataStr + "); true;"
      );
    }
  };

  useEffect(() => {
    pushData();
  }, [dataStr]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        onLoadEnd={pushData}
        startInLoadingState
        androidLayerType="hardware"
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  map: { flex: 1, backgroundColor: "transparent" },
});
