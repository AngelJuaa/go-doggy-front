import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { styles } from "./NotificacionesClienteStyles";

const NOTIFICACIONES_CLIENTE = [
  {
    id: 1,
    iconColor: "#1E88E5",
    iconText: "📣",
    titulo: "Paseo confirmado",
    fecha: "24 Junio 2026",
    subtitulo: "Tu paseo fue aceptado",
    descripcion:
      "Tu paseador ya está en camino. Revisa el mapa en tiempo real y mantente listo para recibirlo en la ubicación acordada.",
  },
  {
    id: 2,
    iconColor: "#43A047",
    iconText: "✅",
    titulo: "Paseo finalizado",
    fecha: "24 Junio 2026",
    subtitulo: "¡Gracias por confiar en GoDoggy!",
    descripcion:
      "El paseo ha terminado con éxito. Puedes calificar al paseador y dejar tus comentarios para mejorar el servicio.",
  },
  {
    id: 3,
    iconColor: "#FB8C00",
    iconText: "💬",
    titulo: "Mensaje del paseador",
    fecha: "23 Junio 2026",
    subtitulo: "Actualización en tu servicio",
    descripcion:
      "Tu paseador te ha enviado un mensaje con un detalle importante sobre el paseo. Revísalo para continuar con la comunicación.",
  },
];

export default function NotificacionesCliente({ navigation }) {
  const [hoveredTab, setHoveredTab] = useState(null);

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.navigate("PerfilUsuario")}>
          <Text style={styles.navIcon}>☰</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.navIcon}>↩</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.titleText}>Notificaciones</Text>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {NOTIFICACIONES_CLIENTE.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.item}
            onPress={() =>
              navigation.navigate("NotificacionDetalle", {
                notificacion: item,
                role: "cliente",
              })
            }
          >
            <View style={[styles.iconCircle, { backgroundColor: item.iconColor }]}>
              <Text style={styles.iconText}>{item.iconText}</Text>
            </View>
            <View style={styles.itemBody}>
              <Text style={styles.itemTitle}>{item.titulo}</Text>
              <Text style={styles.itemFecha}>{item.fecha}</Text>
            </View>
            <Text style={styles.arrow}>▶</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.bottomTab}>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(0)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(0)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("Inicio_cliente")}
        >
          {hoveredTab === 0 && <Text style={styles.tabLabel}>Inicio</Text>}
          <Image
            source={require("../../../../assets/casa.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(1)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(1)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("Servicio_Cliente_Inicio")}
        >
          {hoveredTab === 1 && <Text style={styles.tabLabel}>Servicio</Text>}
          <Image
            source={require("../../../../assets/puntos.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(2)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(2)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("MapaCliente")}
        >
          {hoveredTab === 2 && <Text style={styles.tabLabel}>Mapa</Text>}
          <Image
            source={require("../../../../assets/maps.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(3)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(3)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("NotificacionesCliente")}
        >
          {hoveredTab === 3 && (
            <Text style={styles.tabLabel}>Notificaciones</Text>
          )}
          <Image
            source={require("../../../../assets/Notificaciones.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
