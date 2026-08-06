import { StyleSheet } from "react-native";

export const welcomeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F0",
    alignItems: "center",
  },
  // Imagen superior: ocupa el 46% del alto, ancho completo
  backgroundImage: {
    width: "100%",
    height: "46%",
    resizeMode: "cover",
  },
  // Tarjeta: ancho porcentual, centrada, sube sobre la imagen
  card: {
    width: "88%",
    maxWidth: 460,
    flex: 1,
    backgroundColor: "rgba(245, 239, 218, 0.98)",
    marginTop: "-12%",
    marginBottom: "8%",
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  pregunta: {
    fontSize: 22,
    marginBottom: 28,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  buttonDueño: {
    backgroundColor: "#7CEDA3",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonPaseador: {
    backgroundColor: "#B3E5FC",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
  },
  buttonText: { fontSize: 17, fontWeight: "bold", color: "#333" },
  // legacy (por compatibilidad)
  header: {},
  title: { fontSize: 36, fontWeight: "bold", color: "#000" },
});
