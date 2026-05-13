import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { styles } from "./Servicio_Cliente_OfertasStyles";

export default function Servicio_Cliente_Ofertas({ route, navigation }) {

  // ========================
  // ESTADOS
  // ========================
  const [ofertas, setOfertas] = useState([]);
  const [hoveredTab, setHoveredTab] = useState(null);

  // ========================
  // FUNCIONES
  // ========================
  const regresar = () => navigation.goBack();

  useFocusEffect(
    useCallback(() => {
      const cargarOfertas = async () => {
        try {
          console.log("Cargando ofertas...");
          setOfertas([]);
        } catch (error) {
          console.error("Error cargando ofertas:", error);
          setOfertas([]);
        }
      };
      cargarOfertas();
    }, [])
  );

  // ========================
  // DATOS DE EJEMPLO
  // ========================
  const ofertasEjemplo = [
    {
      id: 1,
      nombre: "Alimento Premium - 50% OFF",
      tipo: "Flash Sale",
      precio: "$22.99",
      imagen: require("../../../assets/perro1.jpg"),
    },
    {
      id: 2,
      nombre: "Correa + Collar Bundle",
      tipo: "Super Oferta",
      precio: "$39.99",
      imagen: require("../../../assets/perro1.jpg"),
    },
    {
      id: 3,
      nombre: "Paseo Gratis - Referral",
      tipo: "Programa de Referencia",
      precio: "GRATIS",
      imagen: require("../../../assets/perro1.jpg"),
    },
    {
      id: 4,
      nombre: "Kit Completo Cuidado",
      tipo: "Mega Descuento",
      precio: "$69.99",
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
      <Text style={styles.titleText}>Ofertas</Text>

      {/* CONTENIDO */}
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {ofertasEjemplo.map((oferta, index) => (
          <TouchableOpacity
            key={`${oferta.id}-${index}`}
            style={styles.ofertaCard}
            onPress={() => navigation.navigate("Servicio_Detalles_Ofertas", { oferta })}
          >
            {/* IMAGEN IZQUIERDA */}
            <Image
              source={oferta.imagen}
              style={styles.ofertaImage}
            />

            {/* INFORMACIÓN CENTRAL */}
            <View style={styles.ofertaInfo}>
              <Text style={styles.ofertaName}>{oferta.nombre}</Text>
              <Text style={styles.ofertaType}>{oferta.tipo}</Text>
            </View>

            {/* PRECIO DERECHA */}
            <Text style={styles.precio}>{oferta.precio}</Text>
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
