import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { styles } from "./Servicio_Cliente_EstéticaStyles";

export default function Servicio_Cliente_Estetica({ route, navigation }) {

  // ========================
  // ESTADOS
  // ========================
  const [servicios, setServicios] = useState([]);
  const [hoveredTab, setHoveredTab] = useState(null);

  // ========================
  // FUNCIONES
  // ========================
  const regresar = () => navigation.goBack();

  useFocusEffect(
    useCallback(() => {
      const cargarServicios = async () => {
        try {
          console.log("Cargando servicios de estética...");
          setServicios([]);
        } catch (error) {
          console.error("Error cargando servicios:", error);
          setServicios([]);
        }
      };
      cargarServicios();
    }, [])
  );

  // ========================
  // DATOS DE EJEMPLO
  // ========================
  const serviciosEjemplo = [
    {
      id: 1,
      nombre: "Baño y Secado",
      tipo: "Higiene",
      empresa: "Pet Spa Deluxe",
      imagen: require("../../../assets/perro1.jpg"),
    },
    {
      id: 2,
      nombre: "Corte y Peinado",
      tipo: "Grooming",
      empresa: "Style Dogs",
      imagen: require("../../../assets/perro1.jpg"),
    },
    {
      id: 3,
      nombre: "Limpieza de Oídos",
      tipo: "Higiene Especializada",
      empresa: "Vet Care Plus",
      imagen: require("../../../assets/perro1.jpg"),
    },
    {
      id: 4,
      nombre: "Corte de Uñas",
      tipo: "Mantenimiento",
      empresa: "Pawsome Grooming",
      imagen: require("../../../assets/perro1.jpg"),
    },
  ];

  return (
    <View style={styles.container}>

      {/* BOTÓN REGRESAR */}
      <TouchableOpacity onPress={regresar} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      {/* TÍTULO */}
      <Text style={styles.titleText}>Estética y Grooming</Text>

      {/* CONTENIDO */}
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {serviciosEjemplo.map((servicio, index) => (
          <TouchableOpacity
            key={`${servicio.id}-${index}`}
            style={styles.servicioCard}
            onPress={() => navigation.navigate("Servicio_Detalles_Estetica", { servicio })}
          >
            {/* IMAGEN IZQUIERDA */}
            <Image
              source={servicio.imagen}
              style={styles.servicioImage}
            />

            {/* INFORMACIÓN CENTRAL */}
            <View style={styles.servicioInfo}>
              <Text style={styles.servicioName}>{servicio.nombre}</Text>
              <Text style={styles.servicioType}>{servicio.tipo}</Text>
              <Text style={styles.empresa}>{servicio.empresa}</Text>
            </View>
          </TouchableOpacity>
        ))}

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
