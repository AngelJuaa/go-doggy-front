import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { styles } from "./ServicioClientePromocionesStyles";

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
    }, []),
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
      imagen: { uri: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=85" },
      precio_original: "$175.00", precio_descuento: "$140.00", descripcion: "Paquete de cinco paseos de 30 minutos con paseadores profesionales.", incluye: "Cinco paseos y seguimiento personalizado", validez: "30 días desde la compra", vencimiento: "31 de diciembre de 2026", codigo_promocional: "PASEOS20", condiciones: "No acumulable con otras promociones.",
    },
    {
      id: 2,
      nombre: "Baño + Corte",
      tipo: "Estética Combo",
      descuento: "-15%",
      imagen: { uri: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=85" },
      precio_original: "$80.00", precio_descuento: "$68.00", descripcion: "Combo de higiene y estilo para consentir a tu perro en una sola visita.", incluye: "Baño, secado, corte y perfume", validez: "60 días desde la compra", vencimiento: "31 de diciembre de 2026", codigo_promocional: "BAÑOCORTE15", condiciones: "Sujeto a disponibilidad y tamaño de la mascota.",
    },
    {
      id: 3,
      nombre: "Comida Premium Bundle",
      tipo: "Pack Alimenticio",
      descuento: "-25%",
      imagen: { uri: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=85" },
      precio_original: "$60.00", precio_descuento: "$45.00", descripcion: "Selección de alimento premium y premios para mantener una rutina nutritiva.", incluye: "Alimento seco, snacks y guía de porciones", validez: "30 días desde la compra", vencimiento: "30 de noviembre de 2026", codigo_promocional: "NUTRI25", condiciones: "Válido en productos participantes.",
    },
    {
      id: 4,
      nombre: "Membresía Mensual",
      tipo: "Acceso Ilimitado",
      descuento: "-30%",
      imagen: { uri: "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=800&q=85" },
      precio_original: "$299.00", precio_descuento: "$209.00", descripcion: "Membresía con beneficios especiales para familias que usan servicios frecuentemente.", incluye: "Descuentos, prioridad de agenda y asesoría básica", validez: "Un mes", vencimiento: "Activación al comprar", codigo_promocional: "CLUB30", condiciones: "Renovación mensual opcional.",
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
            onPress={() =>
              navigation.navigate("Servicio_Detalles_Promociones", {
                promocion,
              })
            }
          >
            {/* IMAGEN IZQUIERDA */}
            <Image source={promocion.imagen} style={styles.promocionImage} />

            {/* INFORMACIÓN CENTRAL */}
            <View style={styles.promocionInfo}>
              <Text style={styles.promocionName}>{promocion.nombre}</Text>
              <Text style={styles.promocionType}>{promocion.tipo}</Text>
              <Text style={styles.promocionDescription} numberOfLines={2}>{promocion.descripcion}</Text>
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
