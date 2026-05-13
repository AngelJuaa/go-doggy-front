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
  titleText: { fontSize: 22, fontWeight: "bold" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 20,
    marginTop: 20,
  },
  separator: {
    height: 3,
    backgroundColor: "#000",
    marginHorizontal: 20,
    marginTop: 5,
    marginBottom: 20,
  },
  card: { paddingHorizontal: 30, marginBottom: 30 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  petName: { fontSize: 20, fontWeight: "bold" },
  rutaBtn: { borderBottomWidth: 1, borderColor: "#000" },
  rutaText: { fontSize: 18, fontWeight: "bold" },
  dateText: { fontSize: 16, marginTop: 10, fontWeight: "500" },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  star: { fontSize: 25, marginLeft: 2 },
  arrow: { fontSize: 35, position: "absolute", right: 20, top: 20 },
});
