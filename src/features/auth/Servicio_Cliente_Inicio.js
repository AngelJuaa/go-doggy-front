import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { styles } from "./Servicio_ClienteInicioStyles";

export default function Servicio_Cliente_Inicio({ route, navigation }) {

  // ========================
  // ESTADOS
  // ========================
  const [hoveredTab, setHoveredTab] = useState(null);

  // ========================
  // FUNCIONES
  // ========================
  const regresar = () => navigation.goBack();

  // ========================
  // DATOS DE SECCIONES
  // ========================
  const secciones = [
    {
      id: 1,
      nombre: "Comida",
      imagen: require("../../../assets/imagen_comida_perro.png"),
      action: () => navigation.navigate("Servicio_Cliente_Comida"),
    },
    {
      id: 2,
      nombre: "Paseadores",
      imagen: require("../../../assets/imagen_perro_correa.png"),
      action: () => navigation.navigate("Servicio_Cliente_Paseador"),
    },
    {
      id: 3,
      nombre: "Estética",
      imagen: require("../../../assets/Imagen_estetica.png"),
      action: () => navigation.navigate("Servicio_Cliente_Estetica"),
    },
    {
      id: 4,
      nombre: "Accesorios",
      imagen: require("../../../assets/imagen_Accesorios.png"),
      action: () => navigation.navigate("Servicio_Cliente_Accesorios"),
    },
    {
      id: 5,
      nombre: "Promociones",
      imagen: require("../../../assets/Imagen_Oferta.png"),
      action: () => navigation.navigate("Servicio_Cliente_Promociones"),
    },
    {
      id: 6,
      nombre: "Ofertas",
      imagen: require("../../../assets/Imagen_descuentos.png"),
      action: () => navigation.navigate("Servicio_Cliente_Ofertas"),
    },
  ];

  // ========================
  // UI
  // ========================
  return (
    <View style={styles.container}>

      {/* BOTÓN REGRESAR */}
      <TouchableOpacity onPress={regresar} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      {/* TÍTULO */}
      <Text style={styles.titleText}>Servicios</Text>

      {/* CONTENIDO */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {secciones.map((seccion) => (
            <TouchableOpacity
              key={seccion.id}
              style={styles.gridItem}
              onPress={seccion.action}
            >
              <Image
                source={seccion.imagen}
                style={styles.gridImage}
              />
              <View style={styles.gridOverlay}>
                <Text style={styles.gridLabel}>{seccion.nombre}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* BARRA INFERIOR */}
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
            source={require("../../../assets/casa.png")}
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
            source={require("../../../assets/puntos.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(2)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(2)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => {/* Navegar a Mapa */}}
        >
          {hoveredTab === 2 && <Text style={styles.tabLabel}>Mapa</Text>}
          <Image
            source={require("../../../assets/maps.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(3)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(3)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => {/* Navegar a Notificaciones */}}
        >
          {hoveredTab === 3 && <Text style={styles.tabLabel}>Notificaciones</Text>}
          <Image
            source={require("../../../assets/Notificaciones.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
      </View>

    </View>
  );
}
