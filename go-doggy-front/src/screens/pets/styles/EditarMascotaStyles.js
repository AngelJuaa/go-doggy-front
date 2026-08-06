import { StyleSheet } from "react-native";
import { s, vs, ms } from "../../../utils/responsive";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: s(18),
    paddingTop: vs(50),
  },
  title: { fontSize: ms(26), textAlign: "center", fontFamily: "serif", marginBottom: vs(10) },
  formCard: {
    backgroundColor: "#99D9C1",
    marginHorizontal: s(18),
    borderRadius: s(40),
    padding: s(20),
    alignItems: "center",
    elevation: 5,
  },
  avatarContainer: { alignItems: "center", marginBottom: vs(18) },
  avatar: {
    width: s(105),
    height: s(105),
    borderRadius: s(53),
    backgroundColor: "#fff",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  petImage: { width: "100%", height: "100%", resizeMode: "cover" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: vs(14),
  },
  inputGroup: { width: "48%" },
  fullInputGroup: { width: "100%", marginBottom: vs(14) },
  label: { fontSize: ms(13), fontWeight: "bold", marginBottom: vs(4) },
  input: {
    backgroundColor: "#D9D9D9",
    height: vs(40),
    borderRadius: s(8),
    paddingHorizontal: s(10),
  },
  saveBtn: {
    backgroundColor: "#E6B5B5",
    paddingVertical: vs(12),
    paddingHorizontal: s(45),
    borderRadius: s(25),
    marginTop: vs(10),
  },
  saveBtnText: { fontWeight: "bold", fontSize: ms(17), color: "#000" },
});
