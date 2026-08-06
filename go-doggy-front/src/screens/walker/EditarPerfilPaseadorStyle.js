import { StyleSheet } from "react-native";
import { s, vs, ms } from "../../utils/responsive";

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: s(18),
    paddingBottom: vs(30),
  },
  header: {
    paddingTop: vs(50),
    paddingBottom: vs(18),
    alignItems: "flex-start",
  },
  back: {
    fontSize: ms(26),
    color: "#111827",
  },
  title: {
    fontSize: ms(22),
    fontWeight: "bold",
    color: "#111827",
    marginBottom: vs(16),
  },
  formCard: {
    backgroundColor: "#99D9C1",
    borderRadius: s(28),
    padding: s(20),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: vs(18),
  },
  photo: {
    width: s(120),
    height: s(120),
    borderRadius: s(60),
    borderWidth: 2,
    borderColor: "#0D6EFD",
    backgroundColor: "#E5E7EB",
  },
  photoButton: {
    marginTop: vs(12),
    backgroundColor: "#ffffff",
    paddingVertical: vs(10),
    paddingHorizontal: s(18),
    borderRadius: s(14),
  },
  photoButtonText: {
    color: "#0D6EFD",
    fontWeight: "700",
    fontSize: ms(14),
  },
  inputGroup: {
    marginBottom: vs(16),
  },
  inputGroup: {
    marginBottom: vs(16),
  },
  label: {
    fontSize: ms(14),
    fontWeight: "700",
    color: "#334155",
    marginBottom: vs(6),
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: s(14),
    paddingVertical: vs(10),
    paddingHorizontal: s(14),
    fontSize: ms(15),
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  textArea: {
    minHeight: vs(90),
    textAlignVertical: "top",
  },
  submitBtn: {
    marginTop: vs(10),
    backgroundColor: "#0D6EFD",
    paddingVertical: vs(16),
    borderRadius: s(18),
    alignItems: "center",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: ms(16),
    fontWeight: "bold",
  },
  bottomTab: {
    flexDirection: "row",
    backgroundColor: "#99D9C1",
    height: vs(70),
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: {
    alignItems: "center",
    gap: vs(4),
  },
  tabIcon: {
    fontSize: ms(20),
  },
  tabLabel: {
    fontSize: ms(11),
    fontWeight: "bold",
    color: "#1A1A1A",
  },
});
