import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { styles } from "./ServicioClienteEsteticaStyles";

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
    }, []),
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
      imagen: { uri: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=85" },
      precio: "$35.00", duracion: "45 minutos", descripcion: "Baño completo con secado y cepillado para dejar el pelaje limpio y brillante.", productos_usados: "Champú hipoalergénico y acondicionador", incluye: "Baño, secado, cepillado y corte de uñas", experiencia: "8 años en grooming",
    },
    {
      id: 2,
      nombre: "Corte y Peinado",
      tipo: "Grooming",
      empresa: "Style Dogs",
      imagen: { uri: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=85" },
      precio: "$48.00", duracion: "60 minutos", descripcion: "Corte personalizado según la raza y el estilo elegido por la familia.", productos_usados: "Productos hidratantes y spray desenredante", incluye: "Corte, peinado, baño y perfume suave", experiencia: "Estilistas certificados",
    },
    {
      id: 3,
      nombre: "Limpieza de Oídos",
      tipo: "Higiene Especializada",
      empresa: "Vet Care Plus",
      imagen: { uri: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=85" },
      precio: "$20.00", duracion: "20 minutos", descripcion: "Limpieza cuidadosa para retirar suciedad y ayudar a prevenir molestias.", productos_usados: "Solución ótica veterinaria", incluye: "Revisión externa y limpieza", experiencia: "Supervisión veterinaria",
    },
    {
      id: 4,
      nombre: "Corte de Uñas",
      tipo: "Mantenimiento",
      empresa: "Pawsome Grooming",
      imagen: { uri: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=85" },
      precio: "$15.00", duracion: "15 minutos", descripcion: "Corte seguro de uñas para mejorar la comodidad durante los paseos.", productos_usados: "Cortaúñas profesional y lima", incluye: "Corte, limado y revisión de almohadillas", experiencia: "Manejo amable y paciente",
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
            onPress={() =>
              navigation.navigate("Servicio_Detalles_Estetica", { servicio })
            }
          >
            {/* IMAGEN IZQUIERDA */}
            <Image source={servicio.imagen} style={styles.servicioImage} />

            {/* INFORMACIÓN CENTRAL */}
            <View style={styles.servicioInfo}>
              <Text style={styles.servicioName}>{servicio.nombre}</Text>
              <Text style={styles.servicioType}>{servicio.tipo}</Text>
              <Text style={styles.empresa}>{servicio.empresa}</Text>
              <Text style={styles.servicioDescription} numberOfLines={2}>{servicio.descripcion}</Text>
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
            source={require("../../../../../assets/casa.png")}
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
            source={require("../../../../../assets/puntos.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(2)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(2)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => {
            Alert.alert("Próximamente", "El mapa estará disponible pronto.")
          }}
        >
          {hoveredTab === 2 && <Text style={styles.tabLabel}>Mapa</Text>}
          <Image
            source={require("../../../../../assets/maps.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(3)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(3)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => {
            Alert.alert("Próximamente", "Las notificaciones estarán disponibles pronto.")
          }}
        >
          {hoveredTab === 3 && (
            <Text style={styles.tabLabel}>Notificaciones</Text>
          )}
          <Image
            source={require("../../../../../assets/Notificaciones.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
