import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { styles } from "./CalificacionesUsuarioStyles";

export default function CalificacionesUsuario({ navigation }) {
  const calificaciones = [
    {
      id: 1,
      mascota: "Kronos",
      fecha: "17 Diciembre 2025",
      estrellas: [1, 1, 1, 0, 0],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Image
          source={require("../../../assets/puntos.png")}
          style={styles.iconTitle}
        />
        <View style={styles.titleBox}>
          <Text style={styles.titleText}>Calificaciones</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 28 }}>↩</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Calificaciones</Text>
      <View style={styles.separator} />

      <ScrollView>
        {calificaciones.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.petName}>{item.mascota}</Text>
              <TouchableOpacity style={styles.rutaBtn}>
                <Text style={styles.rutaText}>Ruta</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.dateText}>{item.fecha}</Text>

            <View style={styles.starsContainer}>
              {item.estrellas.map((s, index) => (
                <Text
                  key={index}
                  style={[styles.star, { color: s ? "#FFD700" : "#C0C0C0" }]}
                >
                  ★
                </Text>
              ))}
            </View>

            <TouchableOpacity style={styles.arrow}>
              <Text style={{ fontSize: 30 }}>›</Text>
            </TouchableOpacity>

            <View
              style={[styles.separator, { marginHorizontal: 0, marginTop: 25 }]}
            />
          </View>
        ))}
      </ScrollView>

      <View
        style={{
          height: 70,
          backgroundColor: "#99D9C1",
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        <Image
          source={require("../../../assets/casa.png")}
          style={{ width: 35, height: 35 }}
        />
        <Image
          source={require("../../../assets/puntos.png")}
          style={{ width: 35, height: 35 }}
        />
        <Image
          source={require("../../../assets/maps.png")}
          style={{ width: 35, height: 35 }}
        />
        <Image
          source={require("../../../assets/Notificaciones.png")}
          style={{ width: 35, height: 35 }}
        />
      </View>
    </View>
  );
}
