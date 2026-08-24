import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { styles } from "./ServicioClienteAccesoriosStyles";

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
    }, []),
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
      imagen: { uri: "https://images.unsplash.com/photo-1558929996-da64ba858215?auto=format&fit=crop&w=800&q=85" },
      categoria: "Correas y arneses", material: "Nylon reforzado", largo: "1.5 metros", colores_disponibles: "Negro, rojo y azul", descripcion: "Correa acolchada con asa ergonómica para paseos cómodos y seguros.", especificaciones: "Resistencia hasta 40 kg, broche metálico giratorio", garantia: "2 años", envio: "Envío gratis desde $50",
    },
    {
      id: 2,
      nombre: "Collar Ajustable",
      tipo: "Seguridad",
      precio: "$19.99",
      imagen: { uri: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=800&q=85" },
      categoria: "Collares", material: "Nylon impermeable", largo: "30 a 50 cm ajustable", colores_disponibles: "Verde, rosa y gris", descripcion: "Collar ligero con cierre seguro y espacio para placa de identificación.", especificaciones: "Hebilla de liberación rápida y costuras reforzadas", garantia: "1 año", envio: "Entrega de 2 a 4 días",
    },
    {
      id: 3,
      nombre: "Cama Confortable",
      tipo: "Descanso",
      precio: "$89.99",
      imagen: { uri: "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=800&q=85" },
      categoria: "Descanso", material: "Tela suave y espuma", largo: "90 x 70 cm", colores_disponibles: "Gris y beige", descripcion: "Cama acolchada con borde elevado para un descanso cómodo.", especificaciones: "Base antideslizante y funda removible lavable", garantia: "1 año", envio: "Envío gratis",
    },
    {
      id: 4,
      nombre: "Juguetes Interactivos",
      tipo: "Entretenimiento",
      precio: "$24.99",
      imagen: { uri: "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&w=800&q=85" },
      categoria: "Juguetes", material: "Caucho natural", largo: "15 cm", colores_disponibles: "Amarillo y azul", descripcion: "Juguete dispensador de premios que estimula la mente.", especificaciones: "No tóxico, lavable y para mordida media", garantia: "6 meses", envio: "Entrega de 2 a 4 días",
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
            onPress={() =>
              navigation.navigate("Servicio_Detalles_Accesorios", {
                accesorio: producto,
              })
            }
          >
            {/* IMAGEN IZQUIERDA */}
            <Image source={producto.imagen} style={styles.productoImage} />

            {/* INFORMACIÓN CENTRAL */}
            <View style={styles.productoInfo}>
              <Text style={styles.productoName}>{producto.nombre}</Text>
              <Text style={styles.productoType}>{producto.tipo}</Text>
              <Text style={styles.productoDescription} numberOfLines={2}>{producto.descripcion}</Text>
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
