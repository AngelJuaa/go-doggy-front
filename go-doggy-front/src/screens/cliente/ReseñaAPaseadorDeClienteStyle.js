import { StyleSheet } from "react-native";
import { s, vs, ms } from "../../utils/responsive";

export default StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  panel: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: s(22),
    borderTopRightRadius: s(22),
    paddingHorizontal: s(20),
    paddingTop: vs(18),
    paddingBottom: vs(26),
    maxHeight: "88%",
  },
  title: { color: "#123C2D", fontSize: ms(21), fontWeight: "800", textAlign: "center" },
  subtitle: { color: "#5D6B66", fontSize: ms(13), textAlign: "center", marginTop: vs(5), marginBottom: vs(16) },
  service: { color: "#285B48", fontSize: ms(12), textAlign: "center", marginBottom: vs(12) },
  category: { marginBottom: vs(14) },
  categoryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  categoryName: { color: "#1F2A26", fontSize: ms(15), fontWeight: "700" },
  stars: { flexDirection: "row", gap: s(4) },
  star: { fontSize: ms(29), color: "#D6DAD8" },
  starSelected: { color: "#F4B942" },
  notesLabel: { color: "#1F2A26", fontSize: ms(15), fontWeight: "700", marginBottom: vs(6) },
  notes: { minHeight: vs(72), borderWidth: 1, borderColor: "#C9D8D1", borderRadius: s(10), padding: s(10), color: "#1F2A26", textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: s(10), marginTop: vs(18) },
  omit: { flex: 1, backgroundColor: "#F28B8B", borderRadius: s(10), paddingVertical: vs(11), alignItems: "center" },
  submit: { flex: 1, backgroundColor: "#2E7D5B", borderRadius: s(10), paddingVertical: vs(11), alignItems: "center" },
  actionText: { color: "#FFFFFF", fontWeight: "800", fontSize: ms(13) },
  error: { color: "#C62828", textAlign: "center", marginTop: vs(8), fontSize: ms(12) },
});
