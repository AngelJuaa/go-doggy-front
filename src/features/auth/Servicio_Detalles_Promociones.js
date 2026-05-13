import React, { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { styles } from "./Servicio_Detalles_PromocioneStyles";

export default function Servicio_Detalles_Promociones({ route, navigation }) {
  const { promocion } = route.params || {};

  const regresar = () => navigation.goBack();

  // ========================
  // DATOS DE EJEMPLO SI NO VIENE POR PARAMS
  // ========================
  const promocionData = promocion || {
    id: 1,
    nombre: "Paseos x 5 - 20% OFF",
    descuento: "20%",
    precio_original: "$175.00",
    precio_descuento: "$140.00",
    imagen: require("../../../assets/perro1.jpg"),
    descripcion: "Paquete especial de 5 paseos diarios con nuestros paseadores profesionales. Disfruta de un 20% de descuento en esta promoción limitada.",
    incluye: "5 paseos de 30 minutos cada uno, Reportes fotográficos diarios, Atención personalizada",
    validez: "30 días desde la compra",
    vencimiento: "31 de Mayo de 2026",
    codigo_promocional: "PASEOS20",
    condiciones: "No acumulable con otras promociones. Válido solo para nuevos clientes.",
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={regresar} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* FOTO PROMOCION */}
        <Image
          source={promocionData.imagen}
          style={styles.promocionImage}
        />

        {/* NOMBRE Y DESCUENTO */}
        <Text style={styles.promocionName}>{promocionData.nombre}</Text>

        {/* BADGE DESCUENTO */}
        <View style={styles.descuentoBadge}>
          <Text style={styles.descuentoText}>{promocionData.descuento} OFF</Text>
        </View>

        {/* PRECIOS */}
        <View style={styles.priceContainer}>
          <Text style={styles.precioOriginal}>{promocionData.precio_original}</Text>
          <Text style={styles.precioDescuento}>{promocionData.precio_descuento}</Text>
        </View>

        {/* DETALLES */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Descripción:</Text>
          <Text style={styles.detailValue}>{promocionData.descripcion}</Text>

          <Text style={styles.detailLabel}>Incluye:</Text>
          <Text style={styles.detailValue}>{promocionData.incluye}</Text>

          <Text style={styles.detailLabel}>Validez:</Text>
          <Text style={styles.detailValue}>{promocionData.validez}</Text>

          <Text style={styles.detailLabel}>Vencimiento:</Text>
          <Text style={styles.detailValue}>{promocionData.vencimiento}</Text>

          <Text style={styles.detailLabel}>Código Promocional:</Text>
          <Text style={styles.codigoPromocional}>{promocionData.codigo_promocional}</Text>

          <Text style={styles.detailLabel}>Condiciones:</Text>
          <Text style={styles.detailValue}>{promocionData.condiciones}</Text>
        </View>

        {/* BOTONES */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.canjearButton}>
            <Text style={styles.buttonText}>Canjear Ahora</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.compartirButton}>
            <Text style={styles.buttonText}>Compartir</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
