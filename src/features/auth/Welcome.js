import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";

export default function Welcome({ route, navigation }) {
  const { tipo } = route.params || { tipo: "cliente" };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
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
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  backText: { fontSize: 14, color: "#E95295", fontWeight: "600" },
  circleContainer: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#F9F9F9",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "#eee",
  },
  logo: { width: "100%", height: "100%", resizeMode: "cover" },
  buttonContainer: { width: "100%", alignItems: "center" },
  btnIniciar: {
    backgroundColor: "#E95295",
    width: "75%",
    paddingVertical: 15,
    borderRadius: 30,
    marginBottom: 20,
    alignItems: "center",
  },
  btnRegistrar: {
    backgroundColor: "#D3D3D3",
    width: "75%",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  btnText: { fontSize: 18, color: "#333", fontWeight: "500" },
});
