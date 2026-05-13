import React, { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { styles } from "./Servicio_Detalles_EstéticaStyles";

export default function Servicio_Detalles_Estetica({ route, navigation }) {
  const { servicio } = route.params || {};

  const regresar = () => navigation.goBack();

  // ========================
  // DATOS DE EJEMPLO SI NO VIENE POR PARAMS
  // ========================
  const servicioData = servicio || {
    id: 1,
    nombre: "Baño y Secado Profesional",
    empresa: "PetSpa Deluxe",
    tipo: "Higiene",
    precio: "$35.00",
    imagen: require("../../../assets/perro1.jpg"),
    duracion: "45 minutos",
    descripcion: "Servicio completo de baño profesional con productos premium para el cuidado de la piel y pelaje de tu perro. Incluye secado meticuloso y cepillado final.",
    productos_usados: "Champú hipoalergénico, Acondicionador naturista, Sérum para brillo",
    incluye: "Baño, Secado, Cepillado, Corte de uñas básico",
    experiencia: "Más de 8 años en grooming profesional",
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={regresar} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* FOTO SERVICIO */}
        <Image
          source={servicioData.imagen}
          style={styles.servicioImage}
        />

        {/* NOMBRE */}
        <Text style={styles.servicioName}>{servicioData.nombre}</Text>

        {/* PRECIO */}
        <View style={styles.priceContainer}>
          <Text style={styles.precio}>{servicioData.precio}</Text>
        </View>

        {/* DETALLES */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Empresa:</Text>
          <Text style={styles.detailValue}>{servicioData.empresa}</Text>

          <Text style={styles.detailLabel}>Tipo de Servicio:</Text>
          <Text style={styles.detailValue}>{servicioData.tipo}</Text>

          <Text style={styles.detailLabel}>Duración:</Text>
          <Text style={styles.detailValue}>{servicioData.duracion}</Text>

          <Text style={styles.detailLabel}>Descripción:</Text>
          <Text style={styles.detailValue}>{servicioData.descripcion}</Text>

          <Text style={styles.detailLabel}>Productos Utilizados:</Text>
          <Text style={styles.detailValue}>{servicioData.productos_usados}</Text>

          <Text style={styles.detailLabel}>Incluye:</Text>
          <Text style={styles.detailValue}>{servicioData.incluye}</Text>

          <Text style={styles.detailLabel}>Experiencia:</Text>
          <Text style={styles.detailValue}>{servicioData.experiencia}</Text>
        </View>

        {/* BOTONES */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.reservarButton}>
            <Text style={styles.buttonText}>Reservar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.buttonText}>Contactar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
