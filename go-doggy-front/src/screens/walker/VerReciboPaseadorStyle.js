import { StyleSheet } from "react-native";
import { s, vs, ms } from "../../utils/responsive";

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: s(20),
    paddingTop: vs(50),
    paddingBottom: vs(10),
    backgroundColor: "#fff",
  },
  back: { fontSize: ms(24) },
  title: { fontSize: ms(17), fontWeight: "bold", color: "#333" },
  content: { padding: s(16), paddingBottom: vs(40) },
  empty: { textAlign: "center", color: "#999", marginTop: vs(40), fontSize: ms(14) },
  card: { backgroundColor: "#99D9C1", borderRadius: s(14), padding: s(16), elevation: 2 },
  label: { fontSize: ms(12), color: "#000", fontWeight: "700", marginTop: vs(12) },
  value: { fontSize: ms(15), color: "#000", marginTop: vs(4) },
  total: { fontSize: ms(20), fontWeight: "bold", color: "#000", marginTop: vs(4) },
  downloadBtn: {
    backgroundColor: "#28a745",
    borderRadius: s(12),
    paddingVertical: vs(14),
    alignItems: "center",
    marginTop: vs(18),
    marginHorizontal: s(0),
  },
  downloadBtnDisabled: {
    backgroundColor: "#7FBF92",
  },
  downloadBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: ms(14),
  },
});
