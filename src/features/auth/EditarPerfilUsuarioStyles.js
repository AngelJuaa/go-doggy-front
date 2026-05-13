import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    textAlign: "center",
    fontFamily: "serif",
    marginBottom: 10,
  },
  formCard: {
    backgroundColor: "#99D9C1",
    marginHorizontal: 20,
    borderRadius: 40,
    padding: 20,
    alignItems: "center",
    elevation: 5,
  },
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 15,
  },
  inputGroup: { width: "48%" },
  fullInputGroup: { width: "100%", marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "bold", marginBottom: 5 },
  input: {
    backgroundColor: "#D9D9D9",
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  saveBtn: {
    backgroundColor: "#E6B5B5",
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginTop: 10,
  },
  saveBtnText: { fontWeight: "bold", fontSize: 18, color: "#000" },
});
