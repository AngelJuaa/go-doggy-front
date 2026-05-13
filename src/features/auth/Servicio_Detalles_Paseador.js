import React, { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { styles } from "./Servicio_Detalles_PaseadorStyles";

export default function Servicio_Detalles_Paseador({ route, navigation }) {
  const { paseador } = route.params || {};

  const regresar = () => navigation.goBack();

  // ========================
  // DATOS DE EJEMPLO SI NO VIENE POR PARAMS
  // ========================
  const paseadorData = paseador || {
    id: 1,
    nombre: "Karina Rodriguez",
    tipo: "Paseo Diario",
    resenias: 4.8,
    imagen: require("../../../assets/imagen_karibe.jpeg"),
    fecha_nacimiento: "1990-05-15",
    telefono: "+34 612 345 678",
    biografia: "Soy una apasionada de los perros con más de 10 años de experiencia en paseos y cuidado. Me encanta pasar tiempo al aire libre y hacer que cada mascota disfrute de su tiempo conmigo. Ofrezco paseos personalizados adaptados a las necesidades de tu perro.",
  };

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

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={regresar} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* FOTO PASEADOR */}
        <Image
          source={paseadorData.imagen}
          style={styles.paseadorImage}
        />

        {/* NOMBRE */}
        <Text style={styles.paseadorName}>{paseadorData.nombre}</Text>

        {/* RESEÑAS */}
        <View style={styles.ratingContainer}>
          {renderStars(paseadorData.resenias)}
        </View>

        {/* DETALLES */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Tipo de Servicio:</Text>
          <Text style={styles.detailValue}>{paseadorData.tipo}</Text>

          <Text style={styles.detailLabel}>Fecha de Nacimiento:</Text>
          <Text style={styles.detailValue}>{paseadorData.fecha_nacimiento}</Text>

          <Text style={styles.detailLabel}>Teléfono:</Text>
          <Text style={styles.detailValue}>{paseadorData.telefono}</Text>

          <Text style={styles.detailLabel}>Biografía:</Text>
          <Text style={styles.detailValue}>{paseadorData.biografia}</Text>
        </View>

        {/* BOTONES */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.buttonText}>Contactar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reservarButton}>
            <Text style={styles.buttonText}>Reservar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
