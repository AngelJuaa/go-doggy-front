import React, { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { styles } from "./Servicio_Detalles_OfertasStyles";

export default function Servicio_Detalles_Ofertas({ route, navigation }) {
  const { oferta } = route.params || {};

  const regresar = () => navigation.goBack();

  // ========================
  // DATOS DE EJEMPLO SI NO VIENE POR PARAMS
  // ========================
  const ofertaData = oferta || {
    id: 1,
    nombre: "Alimento Premium - 50% OFF",
    precio: "$22.99",
    precio_original: "$45.99",
    imagen: require("../../../assets/perro1.jpg"),
    descripcion: "Oferta especial flash: Alimento premium para perros adultos con descuento del 50%. Stock limitado, ¡apúrate! Esta es una oferta por tiempo limitado de nuestro mejor alimento.",
    especificaciones: "Peso: 15 kg, Marca: PetNutrition Pro, Ingredientes naturales sin conservantes",
    stock_disponible: "12 unidades",
    duracion_oferta: "Válida hasta el 5 de Mayo de 2026",
    tiempo_restante: "3 días, 14 horas",
    beneficios: "Proteína de calidad, Vitaminas y minerales esenciales, Grasas saludables para pelaje brillante",
    envio_rapido: "Envío express disponible (24-48 horas)",
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={regresar} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* FOTO OFERTA */}
        <Image
          source={ofertaData.imagen}
          style={styles.ofertaImage}
        />

        {/* NOMBRE */}
        <Text style={styles.ofertaName}>{ofertaData.nombre}</Text>

        {/* BADGE FLASH SALE */}
        <View style={styles.flashBadge}>
          <Text style={styles.flashText}>🔥 OFERTA FLASH</Text>
        </View>

        {/* PRECIOS */}
        <View style={styles.priceContainer}>
          <Text style={styles.precioOriginal}>{ofertaData.precio_original}</Text>
          <Text style={styles.precio}>{ofertaData.precio}</Text>
        </View>

        {/* DETALLES */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Descripción:</Text>
          <Text style={styles.detailValue}>{ofertaData.descripcion}</Text>

          <Text style={styles.detailLabel}>Especificaciones:</Text>
          <Text style={styles.detailValue}>{ofertaData.especificaciones}</Text>

          <Text style={styles.detailLabel}>Beneficios:</Text>
          <Text style={styles.detailValue}>{ofertaData.beneficios}</Text>

          <Text style={styles.detailLabel}>Stock Disponible:</Text>
          <Text style={styles.stockValue}>{ofertaData.stock_disponible}</Text>

          <Text style={styles.detailLabel}>Duración de Oferta:</Text>
          <Text style={styles.detailValue}>{ofertaData.duracion_oferta}</Text>

          <Text style={styles.detailLabel}>Tiempo Restante:</Text>
          <Text style={styles.tiempoValue}>{ofertaData.tiempo_restante}</Text>

          <Text style={styles.detailLabel}>Envío:</Text>
          <Text style={styles.detailValue}>{ofertaData.envio_rapido}</Text>
        </View>

        {/* BOTONES */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.comprarButton}>
            <Text style={styles.buttonText}>Comprar Ahora</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.compartirButton}>
            <Text style={styles.buttonText}>Compartir</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
