import { StyleSheet } from "react-native";
import { s, vs, ms, hp } from "../../../utils/responsive";

export const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#fff", alignItems: "center" },
  headerImage: { width: "100%", height: hp(40), resizeMode: "cover" },
  formCard: {
    backgroundColor: "#F2EBD4",
    width: "90%",
    borderRadius: s(40),
    padding: s(25),
    marginTop: -vs(40),
    marginBottom: vs(20),
    elevation: 5,
  },
  inputContainer: { marginBottom: vs(15) },
  label: { fontSize: ms(16), color: "#444" },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    fontSize: ms(16),
    paddingVertical: vs(2),
  },
  submitBtn: {
    backgroundColor: "#85E5B5",
    paddingVertical: vs(12),
    paddingHorizontal: s(30),
    borderRadius: s(25),
    alignSelf: "center",
    marginTop: vs(15),
  },
  submitBtnText: { fontWeight: "bold", fontSize: ms(16), color: "#333" },
});
