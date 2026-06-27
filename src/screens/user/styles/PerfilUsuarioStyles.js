import { StyleSheet } from "react-native";
import { s, vs, ms, hp } from "../../../utils/responsive";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  header: {
    paddingTop: vs(50),
    paddingHorizontal: s(20),
    alignItems: "flex-end",
  },
  backIcon: { fontSize: ms(26) },
  profileSection: { alignItems: "center", marginBottom: vs(25) },
  userNameContainer: {
    backgroundColor: "#FFF9E6",
    paddingHorizontal: s(35),
    paddingVertical: vs(9),
    borderRadius: s(25),
    marginBottom: vs(18),
  },
  userNameText: { fontSize: ms(24), fontFamily: "serif" },
  profileImage: {
    width: s(140),
    height: s(140),
    borderRadius: s(70),
    borderWidth: 1,
    borderColor: "#000",
  },
  optionsList: { paddingHorizontal: s(28) },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(18),
  },
  optionIcon: { width: s(28), height: s(28), resizeMode: "contain", marginRight: s(18) },
  optionText: { fontSize: ms(18), fontWeight: "bold" },
  bottomTab: {
    flexDirection: "row",
    backgroundColor: "#99D9C1",
    height: vs(65),
    position: "absolute",
    bottom: 0,
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabIconImg: { width: s(38), height: s(38), resizeMode: "contain" },
  tabItem: { alignItems: "center", justifyContent: "center" },
  tabLabel: { fontSize: ms(11), fontWeight: "bold", color: "#333", marginBottom: vs(4) },
});
