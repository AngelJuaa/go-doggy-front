import { StyleSheet } from "react-native";
import { s, vs, ms } from "../../../utils/responsive";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  headerRow: { flexDirection: "row", alignItems: "center", padding: s(18), paddingTop: vs(50) },
  copyright: { fontSize: ms(28), marginRight: s(14) },
  titleBox: { backgroundColor: "#FFF9E6", paddingHorizontal: s(25), paddingVertical: vs(7), borderRadius: s(20), flex: 0.6 },
  titleText: { fontSize: ms(20), fontWeight: "bold" },
  spacer: { flex: 1 },
  backText: { fontSize: ms(26) },
  list: { paddingHorizontal: s(35), marginTop: vs(35) },
  item: { marginBottom: vs(26) },
  itemText: { fontSize: ms(20), fontWeight: "bold" },
  bottomTab: { flexDirection: "row", backgroundColor: "#99D9C1", height: vs(70), position: "absolute", bottom: 0, width: "100%", justifyContent: "space-around", alignItems: "center" },
  tabItem: { alignItems: "center", justifyContent: "center" },
  tabIcon: { fontSize: ms(20) },
  tabLabel: { fontSize: ms(10), fontWeight: "bold", color: "#1a1a1a" },
});
