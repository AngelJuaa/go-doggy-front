import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F0",
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: "flex-end",
  },
  backIcon: {
    fontSize: 28,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  userNameContainer: {
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 20,
  },
  userNameText: {
    fontSize: 26,
    fontFamily: "serif",
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: "#000",
  },
  optionsList: {
    paddingHorizontal: 30,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  optionIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
    marginRight: 20,
  },
  optionText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  bottomTab: {
    flexDirection: "row",
    backgroundColor: "#A3D9C9",
    height: 75,
    position: "absolute",
    bottom: 0,
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabIconImg: {
    width: 45,
    height: 45,
    resizeMode: "contain",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
});
