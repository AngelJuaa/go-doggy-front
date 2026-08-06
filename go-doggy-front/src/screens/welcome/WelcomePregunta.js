import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { welcomeStyles as styles } from "./styles/WelcomeStyles";

export default function WelcomePregunta({ navigation }) {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../../assets/logo.png")}
        style={styles.backgroundImage}
      />

      <View style={styles.card}>
        <Text style={styles.pregunta}>¿Cómo quieres unirte hoy?</Text>

        <TouchableOpacity
          style={styles.buttonDueño}
          onPress={() => navigation.navigate("Welcome", { tipo: "cliente" })}
        >
          <Text style={styles.buttonText}>Como Cliente</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonPaseador}
          onPress={() => navigation.navigate("Welcome", { tipo: "paseador" })}
        >
          <Text style={styles.buttonText}>Como Paseador</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
