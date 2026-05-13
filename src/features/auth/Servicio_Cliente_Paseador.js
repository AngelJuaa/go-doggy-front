import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { styles } from "./Servicio_Cliente_PaseadorStyles";

export default function Servicio_Cliente_Paseador({ route, navigation }) {

  // ========================
  // ESTADOS
  // ========================
  const [paseadores, setPaseadores] = useState([]);
  const [hoveredTab, setHoveredTab] = useState(null);

  // ========================
  // FUNCIONES
  // ========================
  const regresar = () => navigation.goBack();

  useFocusEffect(
    useCallback(() => {
      const cargarPaseadores = async () => {
        try {
          // Obtener usuario de localStorage
          const usuarioGuardado = localStorage.getItem("usuario");
          if (!usuarioGuardado) {
            console.error("No hay usuario guardado en localStorage");
            setPaseadores([]);
            return;
          }

          const usuario = JSON.parse(usuarioGuardado);
          const usuarioId = usuario.usuario_id;
          
          console.log("Cargando paseadores para usuario ID:", usuarioId);

          const response = await fetch(`http://localhost:3000/paseadores/${usuarioId}`);
          const data = await response.json();
          console.log("Paseadores cargados:", data);
          setPaseadores(data);
        } catch (error) {
          console.error("Error cargando paseadores:", error);
          setPaseadores([]);
        }
      };
      cargarPaseadores();
    }, [])
  );

  // ========================
  // DATOS DE EJEMPLO
  // ========================
  const paseadoresEjemplo = [
    {
      id: 1,
      nombre: "Karina Rodriguez",
      tipo: "Paseo Diario",
      resenias: 4.8,
      imagen: require("../../../assets/imagen_karibe.jpeg"),
    },
    {
      id: 2,
      nombre: "Ricardo García",
      tipo: "Paseo Extenso",
      resenias: 4.9,
      imagen: require("../../../assets/imagen_mamberroi.jpeg"),
    },
    {
      id: 3,
      nombre: "Anshelo Arellano",
      tipo: "Paseo + Juego",
      resenias: 4.7,
      imagen: require("../../../assets/imagen_bodoque.jpeg"),
    },
  ];

  // ========================
  // FUNCIÓN PARA RENDERIZAR ESTRELLAS
  // ========================
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <View style={styles.starsContainer}>
        {Array(fullStars).fill(0).map((_, i) => (
          <Text key={`full-${i}`} style={styles.star}>★</Text>
        ))}
        {hasHalfStar && <Text style={styles.halfStar}>⭐</Text>}
        {Array(emptyStars).fill(0).map((_, i) => (
          <Text key={`empty-${i}`} style={styles.emptyStar}>☆</Text>
        ))}
        <Text style={styles.ratingText}>{rating}</Text>
      </View>
    );
  };

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
      <Text style={styles.titleText}>Paseadores Disponibles</Text>

      {/* CONTENIDO */}
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {(paseadores.length === 0 ? paseadoresEjemplo : paseadores).map((paseador, index) => (
          <TouchableOpacity
            key={`${paseador.id || paseador.nombre}-${index}`}
            style={styles.paseadorCard}
            onPress={() => navigation.navigate("Servicio_Detalles_Paseador", { paseador })}
          >
            {/* IMAGEN IZQUIERDA */}
            <Image
              source={paseador.imagen}
              style={styles.paseadorImage}
            />

            {/* INFORMACIÓN CENTRAL */}
            <View style={styles.paseadorInfo}>
              <Text style={styles.paseadorName}>{paseador.nombre}</Text>
              <Text style={styles.serviceType}>{paseador.tipo}</Text>
            </View>

            {/* RESEÑAS DERECHA */}
            {renderStars(paseador.resenias)}
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
