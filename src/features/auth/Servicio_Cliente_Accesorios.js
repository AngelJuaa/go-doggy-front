import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { styles } from "./Servicio_Cliente_AccesoriosStyles";

export default function Servicio_Cliente_Accesorios({ route, navigation }) {

  // ========================
  // ESTADOS
  // ========================
  const [productos, setProductos] = useState([]);
  const [hoveredTab, setHoveredTab] = useState(null);

  // ========================
  // FUNCIONES
  // ========================
  const regresar = () => navigation.goBack();

  useFocusEffect(
    useCallback(() => {
      const cargarProductos = async () => {
        try {
          console.log("Cargando accesorios...");
          setProductos([]);
        } catch (error) {
          console.error("Error cargando productos:", error);
          setProductos([]);
        }
      };
      cargarProductos();
    }, [])
  );

  // ========================
  // DATOS DE EJEMPLO
  // ========================
  const productosEjemplo = [
    {
      id: 1,
      nombre: "Correa Premium",
      tipo: "Paseos",
      precio: "$29.99",
      imagen: require("../../../assets/perro1.jpg"),
    },
    {
      id: 2,
      nombre: "Collar Ajustable",
      tipo: "Seguridad",
      precio: "$19.99",
      imagen: require("../../../assets/perro1.jpg"),
    },
    {
      id: 3,
      nombre: "Cama Confortable",
      tipo: "Descanso",
      precio: "$89.99",
      imagen: require("../../../assets/perro1.jpg"),
    },
    {
      id: 4,
      nombre: "Juguetes Interactivos",
      tipo: "Entretenimiento",
      precio: "$24.99",
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
      <Text style={styles.titleText}>Accesorios</Text>

      {/* CONTENIDO */}
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {productosEjemplo.map((producto, index) => (
          <TouchableOpacity
            key={`${producto.id}-${index}`}
            style={styles.productoCard}
            onPress={() => navigation.navigate("Servicio_Detalles_Accesorios", { accesorio: producto })}
          >
            {/* IMAGEN IZQUIERDA */}
            <Image
              source={producto.imagen}
              style={styles.productoImage}
            />

            {/* INFORMACIÓN CENTRAL */}
            <View style={styles.productoInfo}>
              <Text style={styles.productoName}>{producto.nombre}</Text>
              <Text style={styles.productoType}>{producto.tipo}</Text>
            </View>

            {/* PRECIO DERECHA */}
            <Text style={styles.precio}>{producto.precio}</Text>
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
