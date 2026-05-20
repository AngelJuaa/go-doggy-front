import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
  },
  titleBox: {
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 30,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 0.6,
  },
  titleText: { fontSize: 22, fontWeight: "bold" },
  list: { paddingHorizontal: 40, marginTop: 40 },
  item: { marginBottom: 30 },
  itemText: { fontSize: 22, fontWeight: "bold" },
});
