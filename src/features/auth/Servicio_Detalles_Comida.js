import React, { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { styles } from "./Servicio_Detalles_ComidaStyles";

export default function Servicio_Detalles_Comida({ route, navigation }) {
  const { producto } = route.params || {};

  const regresar = () => navigation.goBack();

  // ========================
  // DATOS DE EJEMPLO SI NO VIENE POR PARAMS
  // ========================
  const productoData = producto || {
    id: 1,
    nombre: "Alimento Premium Perros",
    tipo: "Alimento Seco",
    precio: "$45.99",
    imagen: require("../../../assets/perro1.jpg"),
    marca: "PetNutrition Pro",
    peso: "15 kg",
    descripcion: "Alimento premium de alta calidad especialmente formulado para perros adultos con necesidades nutricionales completas. Contiene proteínas de calidad, vitaminas y minerales esenciales para la salud óptima de tu mascota.",
    ingredientes: "Pollo deshidratado, Arroz integral, Grasas animales, Vitaminas (A, D, E), Minerales (calcio, fósforo, zinc)",
    edad_recomendada: "Adultos (1-7 años)",
    garantia: "Satisfacción 100% garantizada",
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={regresar} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* FOTO PRODUCTO */}
        <Image
          source={productoData.imagen}
          style={styles.productoImage}
        />

        {/* NOMBRE */}
        <Text style={styles.productoName}>{productoData.nombre}</Text>

        {/* PRECIO */}
        <View style={styles.priceContainer}>
          <Text style={styles.precio}>{productoData.precio}</Text>
        </View>

        {/* DETALLES */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Tipo:</Text>
          <Text style={styles.detailValue}>{productoData.tipo}</Text>

          <Text style={styles.detailLabel}>Marca:</Text>
          <Text style={styles.detailValue}>{productoData.marca}</Text>

          <Text style={styles.detailLabel}>Peso:</Text>
          <Text style={styles.detailValue}>{productoData.peso}</Text>

          <Text style={styles.detailLabel}>Edad Recomendada:</Text>
          <Text style={styles.detailValue}>{productoData.edad_recomendada}</Text>

          <Text style={styles.detailLabel}>Descripción:</Text>
          <Text style={styles.detailValue}>{productoData.descripcion}</Text>

          <Text style={styles.detailLabel}>Ingredientes:</Text>
          <Text style={styles.detailValue}>{productoData.ingredientes}</Text>

          <Text style={styles.detailLabel}>Garantía:</Text>
          <Text style={styles.detailValue}>{productoData.garantia}</Text>
        </View>

        {/* BOTONES */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.agregarButton}>
            <Text style={styles.buttonText}>Agregar al Carrito</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.buttonText}>Contactar Vendedor</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
