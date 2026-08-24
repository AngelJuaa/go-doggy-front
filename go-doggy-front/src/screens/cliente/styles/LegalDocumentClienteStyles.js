import { StyleSheet } from "react-native";
import { s, vs, ms } from "../../../utils/responsive";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: s(18), paddingTop: vs(50), backgroundColor: "#99D9C1" },
  title: { flex: 1, color: "#1F2A26", fontSize: ms(20), fontWeight: "800", marginRight: s(12) },
  back: { color: "#1F2A26", fontSize: ms(26) },
  content: { padding: s(20), paddingBottom: vs(110) },
  heading: { color: "#1F4D36", fontSize: ms(17), fontWeight: "800", marginTop: vs(18), marginBottom: vs(7) },
  body: { color: "#333", fontSize: ms(14), lineHeight: ms(22), backgroundColor: "#FFFFFF", borderRadius: s(10), padding: s(14) },
});
