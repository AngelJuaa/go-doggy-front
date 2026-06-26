import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";

export default function Welcome({ route, navigation }) {
  const { tipo } = route.params || { tipo: "cliente" };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate("WelcomePregunta")}
      >
        <Text style={styles.backText}>← No soy {tipo}, cambiar rol</Text>
      </TouchableOpacity>

      <View style={styles.circleContainer}>
        <Image
          source={require("../../../assets/logo.png")}
          style={styles.logo}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.btnIniciar}
          onPress={() => navigation.navigate("Login", { tipo: tipo })}
        >
          <Text style={styles.btnText}>Iniciar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnRegistrar}
          onPress={() => {
            const destino =
              tipo === "cliente" ? "RegistroUsuario" : "RegistroPaseador";
            navigation.navigate(destino);
          }}
        >
          <Text style={styles.btnText}>Registrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "6%",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(233, 82, 149, 0.12)",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backText: { fontSize: 14, color: "#E95295", fontWeight: "700" },
  // Círculo perfecto en cualquier tamaño gracias a aspectRatio + borderRadius alto
  circleContainer: {
    width: "65%",
    maxWidth: 300,
    aspectRatio: 1,
    borderRadius: 9999,
    backgroundColor: "#F9F9F9",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    marginBottom: "10%",
    borderWidth: 1,
    borderColor: "#eee",
  },
  logo: { width: "100%", height: "100%", resizeMode: "cover" },
  buttonContainer: { width: "100%", maxWidth: 460, alignItems: "center" },
  btnIniciar: {
    backgroundColor: "#E95295",
    width: "80%",
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 18,
    alignItems: "center",
  },
  btnRegistrar: {
    backgroundColor: "#D3D3D3",
    width: "80%",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  btnText: { fontSize: 17, color: "#333", fontWeight: "500" },
});
