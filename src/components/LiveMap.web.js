import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix de iconos de Leaflet en web
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [19.4326, -99.1332];

export default function LiveMap({ center, markers = [], route = [] }) {
  return (
    <MapContainer
      center={center || DEFAULT_CENTER}
      zoom={15}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
      />
      {markers.map((m, i) => (
        <Marker key={i} position={m.position}>
          {m.label ? <Popup>{m.label}</Popup> : null}
        </Marker>
      ))}
      {route.length > 1 && <Polyline positions={route} color="#7CEDA3" weight={4} />}
    </MapContainer>
  );
}
