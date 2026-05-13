import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { styles } from "./Servicio_Cliente_PromocioneStyles";

export default function Servicio_Cliente_Promociones({ route, navigation }) {

  // ========================
  // ESTADOS
  // ========================
  const [promociones, setPromociones] = useState([]);
  const [hoveredTab, setHoveredTab] = useState(null);

  // ========================
  // FUNCIONES
  // ========================
  const regresar = () => navigation.goBack();

  useFocusEffect(
    useCallback(() => {
      const cargarPromociones = async () => {
        try {
          console.log("Cargando promociones...");
          setPromociones([]);
        } catch (error) {
          console.error("Error cargando promociones:", error);
          setPromociones([]);
        }
      };
      cargarPromociones();
    }, [])
  );

  // ========================
  // DATOS DE EJEMPLO
  // ========================
  const promocionesEjemplo = [
    {
      id: 1,
      nombre: "Paseos x 5 - 20% OFF",
      tipo: "Pack de Paseos",
      descuento: "-20%",
      imagen: require("../../../assets/perro1.jpg"),
    },
    {
      id: 2,
      nombre: "Baño + Corte",
      tipo: "Estética Combo",
      descuento: "-15%",
      imagen: require("../../../assets/perro1.jpg"),
    },
    {
      id: 3,
      nombre: "Comida Premium Bundle",
      tipo: "Pack Alimenticio",
      descuento: "-25%",
      imagen: require("../../../assets/perro1.jpg"),
    },
    {
      id: 4,
      nombre: "Membresía Mensual",
      tipo: "Acceso Ilimitado",
      descuento: "-30%",
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
      <Text style={styles.titleText}>Promociones</Text>

      {/* CONTENIDO */}
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {promocionesEjemplo.map((promocion, index) => (
          <TouchableOpacity
            key={`${promocion.id}-${index}`}
            style={styles.promocionCard}
            onPress={() => navigation.navigate("Servicio_Detalles_Promociones", { promocion })}
          >
            {/* IMAGEN IZQUIERDA */}
            <Image
              source={promocion.imagen}
              style={styles.promocionImage}
            />

            {/* INFORMACIÓN CENTRAL */}
            <View style={styles.promocionInfo}>
              <Text style={styles.promocionName}>{promocion.nombre}</Text>
              <Text style={styles.promocionType}>{promocion.tipo}</Text>
            </View>

            {/* DESCUENTO DERECHA */}
            <Text style={styles.descuento}>{promocion.descuento}</Text>
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
