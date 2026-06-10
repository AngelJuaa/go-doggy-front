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
  titleBox: {
    backgroundColor: "#FFF9E6",
    paddingHorizontal: s(25),
    paddingVertical: vs(7),
    borderRadius: s(20),
    flex: 0.6,
  },
  titleText: { fontSize: ms(20), fontWeight: "bold" },
  list: { paddingHorizontal: s(35), marginTop: vs(35) },
  item: { marginBottom: vs(26) },
  itemText: { fontSize: ms(20), fontWeight: "bold" },
});
