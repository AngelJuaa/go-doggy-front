import { StyleSheet } from "react-native";
export const loginStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  header: {
    flex: 0.7,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 40,
    zIndex: 2,
  },
  title: { fontSize: 45, fontWeight: "bold", color: "#000" },
  subtitle: { fontSize: 22, color: "#000" },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: 550,
    resizeMode: "cover",
    zIndex: 1,
  },
  loginCard: {
    flex: 0.8,
    backgroundColor: "rgba(245, 239, 218, 0.98)",
    marginHorizontal: 50,
    marginBottom: 60,
    borderRadius: 40,
    padding: 20,
    justifyContent: "center",
    elevation: 10,
    zIndex: 3,
  },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, color: "#555", marginBottom: 2 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    fontSize: 15,
    paddingVertical: 2,
    flex: 1,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  eyeButton: {
    paddingHorizontal: 10,
  },
  eyeText: {
    fontSize: 18,
  },
  loginButton: {
    backgroundColor: "#7CEDA3",
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  forgotPasswordText: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
    marginTop: 10,
  },
  highlightedText: {
    color: "#ff0000",
    fontWeight: "bold",
  },
});
