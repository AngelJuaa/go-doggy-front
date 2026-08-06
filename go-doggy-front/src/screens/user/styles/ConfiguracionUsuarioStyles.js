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
  titleText: { fontSize: ms(19), fontWeight: "bold" },
  list: { paddingHorizontal: s(35), marginTop: vs(18) },
  item: { marginBottom: vs(22) },
  itemText: { fontSize: ms(17), fontWeight: "bold" },
});
