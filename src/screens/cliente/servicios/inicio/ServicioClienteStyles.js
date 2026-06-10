import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F0",
  },
  backButton: {
    position: "absolute",
    top: 48,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  backText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  titleText: {
    fontSize: 28,
    textAlign: "center",
    marginTop: 54,
    marginBottom: 16,
    fontFamily: "serif",
    color: "#333",
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  gridItem: {
    width: "47%",
    height: 150,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#DDD",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gridOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 8,
    alignItems: "center",
  },
  gridLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  // Bottom tab
  bottomTab: {
    flexDirection: "row",
    backgroundColor: "#99D9C1",
    height: 70,
    position: "absolute",
    bottom: 0,
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconImg: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
});
