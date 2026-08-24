import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { styles } from "./ServicioClienteOfertasStyles";

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
    }, []),
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
      imagen: { uri: "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=800&q=85" },
      precio_original: "$45.99", descripcion: "Alimento premium para perros adultos con proteína de calidad y nutrientes esenciales.", especificaciones: "15 kg, receta con pollo y arroz", stock_disponible: "12 unidades", duracion_oferta: "Válida hasta el 31 de diciembre de 2026", tiempo_restante: "Disponible por tiempo limitado", beneficios: "Vitaminas, minerales y grasas saludables", envio_rapido: "Envío express en 24 a 48 horas",
    },
    {
      id: 2,
      nombre: "Correa + Collar Bundle",
      tipo: "Super Oferta",
      precio: "$39.99",
      imagen: { uri: "https://images.unsplash.com/photo-1591946614720-90a587da4a36?auto=format&fit=crop&w=800&q=85" },
      precio_original: "$54.99", descripcion: "Set coordinado para paseos diarios con ajuste cómodo y cierre seguro.", especificaciones: "Correa de nylon, collar ajustable y broche metálico", stock_disponible: "8 paquetes", duracion_oferta: "Válida hasta agotar existencias", tiempo_restante: "Pocas unidades disponibles", beneficios: "Ahorro en dos accesorios esenciales", envio_rapido: "Envío express en 24 a 48 horas",
    },
    {
      id: 3,
      nombre: "Paseo Gratis - Referral",
      tipo: "Programa de Referencia",
      precio: "GRATIS",
      imagen: { uri: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=85" },
      precio_original: "$30.00", descripcion: "Obtén un paseo sin costo al invitar a una nueva familia a GoDoggy.", especificaciones: "Paseo de 30 minutos", stock_disponible: "Cupo limitado", duracion_oferta: "Válida durante la campaña vigente", tiempo_restante: "Consulta disponibilidad", beneficios: "Un paseo gratis por referencia aprobada", envio_rapido: "Servicio digital, sin envío",
    },
    {
      id: 4,
      nombre: "Kit Completo Cuidado",
      tipo: "Mega Descuento",
      precio: "$69.99",
      imagen: { uri: "https://images.unsplash.com/photo-1601758174114-e711c0c4baa0?auto=format&fit=crop&w=800&q=85" },
      precio_original: "$99.99", descripcion: "Kit práctico para cubrir alimentación, paseo, descanso y entretenimiento.", especificaciones: "Comedero, correa, juguete y manta", stock_disponible: "6 kits", duracion_oferta: "Válida hasta el 31 de diciembre de 2026", tiempo_restante: "Oferta limitada", beneficios: "Ahorro y artículos esenciales en un solo paquete", envio_rapido: "Envío express en 24 a 48 horas",
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
            onPress={() =>
              navigation.navigate("Servicio_Detalles_Ofertas", { oferta })
            }
          >
            {/* IMAGEN IZQUIERDA */}
            <Image source={oferta.imagen} style={styles.ofertaImage} />

            {/* INFORMACIÓN CENTRAL */}
            <View style={styles.ofertaInfo}>
              <Text style={styles.ofertaName}>{oferta.nombre}</Text>
              <Text style={styles.ofertaType}>{oferta.tipo}</Text>
              <Text style={styles.ofertaDescription} numberOfLines={2}>{oferta.descripcion}</Text>
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
