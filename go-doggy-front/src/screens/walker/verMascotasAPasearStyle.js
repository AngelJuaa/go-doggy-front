import { StyleSheet } from "react-native";
import { s, vs, ms } from "../../utils/responsive";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F2" },
  content: { padding: s(18), paddingTop: vs(48), paddingBottom: vs(90) },
  backButton: { alignSelf: "flex-start", backgroundColor: "#99D9C1", borderRadius: s(18), paddingHorizontal: s(14), paddingVertical: vs(8) },
  backText: { color: "#1F4D36", fontSize: ms(14), fontWeight: "700" },
  title: { color: "#333", fontSize: ms(25), fontFamily: "serif", textAlign: "center", marginVertical: vs(18) },
  loader: { marginTop: vs(40) },
  emptyText: { color: "#666", fontSize: ms(14), textAlign: "center", marginTop: vs(40) },
  card: { backgroundColor: "#99D9C1", borderRadius: s(18), padding: s(18), alignItems: "center", marginBottom: vs(16) },
  photo: { width: s(100), height: s(100), borderRadius: s(50), borderWidth: 3, borderColor: "#FFFFFF", backgroundColor: "#FFFFFF" },
  name: { color: "#1F2A26", fontSize: ms(21), fontWeight: "700", marginTop: vs(12) },
  detailGroup: { width: "100%", marginTop: vs(14) },
  label: { color: "#1F4D36", fontSize: ms(13), fontWeight: "700", marginBottom: vs(4) },
  value: { color: "#333", fontSize: ms(14), backgroundColor: "rgba(255,255,255,0.8)", borderRadius: s(10), padding: s(10) },
  bottomTab: { flexDirection: "row", backgroundColor: "#99D9C1", height: vs(65), position: "absolute", bottom: 0, width: "100%", justifyContent: "space-around", alignItems: "center" },
  tabItem: { alignItems: "center", gap: vs(2) },
  tabIcon: { fontSize: ms(20) },
  tabLabel: { fontSize: ms(10), fontWeight: "bold", color: "#1A1A1A" },
});
