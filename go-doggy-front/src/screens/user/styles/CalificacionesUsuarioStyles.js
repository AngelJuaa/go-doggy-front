import { StyleSheet } from "react-native";
import { s, vs, ms } from "../../../utils/responsive";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: s(18),
    paddingTop: vs(50),
  },
  iconTitle: { width: s(38), height: s(38), marginRight: s(14) },
  titleBox: {
    backgroundColor: "#FFF9E6",
    paddingHorizontal: s(22),
    paddingVertical: vs(7),
    borderRadius: s(20),
    flex: 1,
  },
  titleText: { fontSize: ms(20), fontWeight: "bold" },
  sectionTitle: { fontSize: ms(17), fontWeight: "bold", marginLeft: s(18), marginTop: vs(18) },
  separator: {
    height: 3,
    backgroundColor: "#000",
    marginHorizontal: s(18),
    marginTop: vs(4),
    marginBottom: vs(18),
  },
  card: { paddingHorizontal: s(25), marginBottom: vs(25) },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  petName: { fontSize: ms(18), fontWeight: "bold" },
  rutaBtn: { borderBottomWidth: 1, borderColor: "#000" },
  rutaText: { fontSize: ms(16), fontWeight: "bold" },
  dateText: { fontSize: ms(15), marginTop: vs(8), fontWeight: "500" },
  starsContainer: { flexDirection: "row", justifyContent: "flex-end", marginTop: vs(8) },
  star: { fontSize: ms(23), marginLeft: s(2) },
  arrow: { fontSize: ms(32), position: "absolute", right: s(18), top: vs(18) },
});
