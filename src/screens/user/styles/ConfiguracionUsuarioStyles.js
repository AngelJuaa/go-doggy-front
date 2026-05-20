import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
  },
  iconTitle: { width: 40, height: 40, marginRight: 15 },
  titleBox: {
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 25,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
  },
  titleText: { fontSize: 20, fontWeight: "bold" },
  list: { paddingHorizontal: 40, marginTop: 20 },
  item: { marginBottom: 25 },
  itemText: { fontSize: 18, fontWeight: "bold" },
});
