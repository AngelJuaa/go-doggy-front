import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#fff", alignItems: "center" },
  headerImage: { width: "100%", height: 350, resizeMode: "cover" },
  formCard: {
    backgroundColor: "#D9F2E6",
    width: "90%",
    borderRadius: 40,
    padding: 25,
    marginTop: -40,
    marginBottom: 20,
    elevation: 5,
  },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 16, color: "#444", marginBottom: 2 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    fontSize: 16,
    paddingVertical: 2,
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  photoBox: {
    width: 90,
    height: 60,
    backgroundColor: "#333",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  photoText: { color: "#fff", fontSize: 10 },
  submitBtn: {
    backgroundColor: "#85E5B5",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: "center",
    marginTop: 20,
  },
  submitBtnText: { fontWeight: "bold", fontSize: 16, color: "#333" },
});
