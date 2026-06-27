import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { styles } from "./ServicioClientePaseadorStyles";
import storage from "../../../../utils/storage";
import { API_URL } from "../../../../utils/api";

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
          // Obtener usuario de storage
          const usuarioGuardado = storage.getItem("usuario");
          if (!usuarioGuardado) {
            console.error("No hay usuario guardado en storage");
            setPaseadores([]);
            return;
          }

          const usuario = JSON.parse(usuarioGuardado);
          const usuarioId = usuario.usuario_id;

          console.log("Cargando paseadores para usuario ID:", usuarioId);

          const response = await fetch(
            `${API_URL}/paseadores/${usuarioId}`,
          );
          const data = await response.json();
          console.log("Paseadores cargados:", data);
          setPaseadores(data);
        } catch (error) {
          console.error("Error cargando paseadores:", error);
          setPaseadores([]);
        }
      };
      cargarPaseadores();
    }, []),
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
      imagen: require("../../../../../assets/imagen_karibe.jpeg"),
    },
    {
      id: 2,
      nombre: "Ricardo García",
      tipo: "Paseo Extenso",
      resenias: 4.9,
      imagen: require("../../../../../assets/imagen_mamberroi.jpeg"),
    },
    {
      id: 3,
      nombre: "Anshelo Arellano",
      tipo: "Paseo + Juego",
      resenias: 4.7,
      imagen: require("../../../../../assets/imagen_bodoque.jpeg"),
    },
  ];

  // ========================
  // FUNCIÓN PARA RENDERIZAR ESTRELLAS
  // ========================
  const renderStars = (rating) => {
    const safeRating = typeof rating === 'number' && !isNaN(rating) ? rating : 0;
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <View style={styles.starsContainer}>
        {Array(fullStars)
          .fill(0)
          .map((_, i) => (
            <Text key={`full-${i}`} style={styles.star}>
              ★
            </Text>
          ))}
        {hasHalfStar && <Text style={styles.halfStar}>⭐</Text>}
        {Array(emptyStars)
          .fill(0)
          .map((_, i) => (
            <Text key={`empty-${i}`} style={styles.emptyStar}>
              ☆
            </Text>
          ))}
        <Text style={styles.ratingText}>{safeRating || '—'}</Text>
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
        {(paseadores.length === 0 ? paseadoresEjemplo : paseadores).map(
          (paseador, index) => {
            // Normalizar campos: datos de API vs datos de ejemplo
            const nombre = paseador.nombre_completo || paseador.nombre || 'Paseador';
            const tipo = paseador.zona_operacion || paseador.tipo || 'Paseo';
            const rating = paseador.resenias || 0;
            const fotoUri = paseador.url_foto_perfil
              ? `${API_URL}/uploads/${paseador.url_foto_perfil}`
              : null;

            return (
              <TouchableOpacity
                key={`${paseador.usuario_id || paseador.id || index}`}
                style={styles.paseadorCard}
                onPress={() =>
                  navigation.navigate("Servicio_Detalles_Paseador", { paseador })
                }
              >
                {/* IMAGEN IZQUIERDA */}
                {paseador.imagen ? (
                  <Image source={paseador.imagen} style={styles.paseadorImage} />
                ) : fotoUri ? (
                  <Image source={{ uri: fotoUri }} style={styles.paseadorImage} />
                ) : (
                  <Image source={require("../../../../../assets/perro1.jpg")} style={styles.paseadorImage} />
                )}

                {/* INFORMACIÓN CENTRAL */}
                <View style={styles.paseadorInfo}>
                  <Text style={styles.paseadorName}>{nombre}</Text>
                  <Text style={styles.serviceType}>{tipo}</Text>
                </View>

                {/* RESEÑAS DERECHA */}
                {renderStars(rating)}
              </TouchableOpacity>
            );
          },
        )}
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
          onPress={() => navigation.navigate("MapaCliente")}
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
          onPress={() => navigation.navigate("NotificacionesUsuario")}
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
