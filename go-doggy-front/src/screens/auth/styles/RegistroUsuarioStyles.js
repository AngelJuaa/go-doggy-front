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
  inputDisabled: {
    color: "#666",
    backgroundColor: "rgba(0,0,0,0.04)",
    paddingHorizontal: s(8),
    borderRadius: s(8),
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: vs(8),
    gap: s(8),
  },
  loadingText: {
    fontSize: ms(13),
    color: "#4A8F6A",
    fontWeight: "600",
  },
  optionList: {
    paddingVertical: vs(8),
    gap: s(8),
  },
  optionChip: {
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    borderRadius: s(18),
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#C9BFA7",
  },
  optionChipSelected: {
    backgroundColor: "#85E5B5",
    borderColor: "#85E5B5",
  },
  optionChipText: {
    fontSize: ms(13),
    color: "#5A5345",
    fontWeight: "600",
  },
  optionChipTextSelected: {
    color: "#1F3A2A",
  },
  helperText: {
    marginTop: vs(6),
    color: "#7A6E59",
    fontSize: ms(12),
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
