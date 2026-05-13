import React, { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { styles } from "./Servicio_Detalles_AccesoriosStyles";

export default function Servicio_Detalles_Accesorios({ route, navigation }) {
  const { accesorio } = route.params || {};

  const regresar = () => navigation.goBack();

  // ========================
  // DATOS DE EJEMPLO SI NO VIENE POR PARAMS
  // ========================
  const accesorioData = accesorio || {
    id: 1,
    nombre: "Correa Premium",
    categoria: "Correas y Arneses",
    precio: "$29.99",
    imagen: require("../../../assets/perro1.jpg"),
    material: "Cuero genuino importado",
    largo: "1.5 metros",
    colores_disponibles: "Negro, Café, Rojo, Azul",
    descripcion: "Correa premium de cuero genuino, ajustable y cómoda para paseos diarios. Diseñada ergonómicamente para mayor comodidad del dueño y seguridad del perro.",
    especificaciones: "Resistencia máxima: 50 kg, Ancho: 2 cm, Peso: 150g",
    garantia: "2 años de garantía contra defectos",
    envio: "Envío gratis en compras mayores a $50",
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={regresar} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* FOTO ACCESORIO */}
        <Image
          source={accesorioData.imagen}
          style={styles.accesorioImage}
        />

        {/* NOMBRE */}
        <Text style={styles.accesorioName}>{accesorioData.nombre}</Text>

        {/* PRECIO */}
        <View style={styles.priceContainer}>
          <Text style={styles.precio}>{accesorioData.precio}</Text>
        </View>

        {/* DETALLES */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Categoría:</Text>
          <Text style={styles.detailValue}>{accesorioData.categoria}</Text>

          <Text style={styles.detailLabel}>Material:</Text>
          <Text style={styles.detailValue}>{accesorioData.material}</Text>

          <Text style={styles.detailLabel}>Largo:</Text>
          <Text style={styles.detailValue}>{accesorioData.largo}</Text>

          <Text style={styles.detailLabel}>Colores Disponibles:</Text>
          <Text style={styles.detailValue}>{accesorioData.colores_disponibles}</Text>

          <Text style={styles.detailLabel}>Descripción:</Text>
          <Text style={styles.detailValue}>{accesorioData.descripcion}</Text>

          <Text style={styles.detailLabel}>Especificaciones:</Text>
          <Text style={styles.detailValue}>{accesorioData.especificaciones}</Text>

          <Text style={styles.detailLabel}>Garantía:</Text>
          <Text style={styles.detailValue}>{accesorioData.garantia}</Text>

          <Text style={styles.detailLabel}>Envío:</Text>
          <Text style={styles.detailValue}>{accesorioData.envio}</Text>
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
