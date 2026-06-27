import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F2F2F2",
	},
	navbar: {
		flexDirection: "row",
		justifyContent: "flex-start",
		paddingHorizontal: 18,
		paddingTop: 50,
	},
	navIcon: {
		fontSize: 26,
	},
	keyboardAvoid: {
		flex: 1,
	},
	contentContainer: {
		paddingHorizontal: 16,
		paddingTop: 14,
		paddingBottom: 100,
	},
	title: {
		fontSize: 28,
		textAlign: "center",
		color: "#222",
		fontFamily: "serif",
		marginBottom: 6,
	},
	subtitle: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
		marginBottom: 18,
	},
	formCard: {
		backgroundColor: "#99D9C1",
		borderRadius: 20,
		paddingVertical: 18,
		paddingHorizontal: 14,
		shadowColor: "#000",
		shadowOpacity: 0.12,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 6 },
		elevation: 4,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#333",
		marginBottom: 12,
	},
	label: {
		fontSize: 13,
		color: "#4C4C4C",
		fontWeight: "600",
		marginBottom: 6,
		marginTop: 8,
	},
	input: {
		width: "100%",
		minHeight: 44,
		borderWidth: 1,
		borderColor: "#DEDEDE",
		borderRadius: 12,
		backgroundColor: "#FAFAFA",
		paddingHorizontal: 12,
		paddingVertical: 10,
		color: "#222",
		fontSize: 14,
	},
	inputFocused: {
		borderColor: "#A67C52",
		shadowColor: "#A67C52",
		shadowOpacity: 0.22,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 0 },
		elevation: 3,
	},
	inputDisabled: {
		backgroundColor: "#F0F0F0",
		color: "#666",
	},
	textArea: {
		minHeight: 96,
	},
	row: {
		flexDirection: "row",
		gap: 10,
	},
	rowItem: {
		flex: 1,
	},
	saveButton: {
		marginTop: 18,
		minHeight: 46,
		borderRadius: 14,
		backgroundColor: "#E6B5B5",
		alignItems: "center",
		justifyContent: "center",
	},
	saveButtonDisabled: {
		opacity: 0.6,
	},
	saveButtonText: {
		fontSize: 15,
		fontWeight: "700",
		color: "#2A2A2A",
		letterSpacing: 0.3,
	},
	helperText: {
		marginTop: 10,
		fontSize: 12,
		color: "#6B6B6B",
		textAlign: "center",
	},
	loadingWrapper: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	loadingText: {
		marginTop: 12,
		color: "#666",
	},
	bottomTab: {
		flexDirection: "row",
		backgroundColor: "#99D9C1",
		height: 65,
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
	tabLabel: {
		fontSize: 11,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 4,
	},
});
