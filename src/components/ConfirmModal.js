import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { s, vs, ms } from "../utils/responsive";

export default function ConfirmModal({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText  = "Confirmar",
  cancelText   = "Cancelar",
  confirmColor = "#99D9C1",
}) {
  return (
    <Modal visible={!!visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: confirmColor }]} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: s(20),
    padding: s(24),
    width: "82%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: ms(17),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: vs(8),
    color: "#1A1A1A",
  },
  message: {
    fontSize: ms(14),
    textAlign: "center",
    color: "#555",
    marginBottom: vs(22),
    lineHeight: ms(20),
  },
  buttons: {
    flexDirection: "row",
    gap: s(12),
  },
  btn: {
    flex: 1,
    paddingVertical: vs(12),
    borderRadius: s(12),
    alignItems: "center",
  },
  cancelBtn: { backgroundColor: "#EBEBEB" },
  cancelText:  { fontWeight: "600", color: "#555",   fontSize: ms(14) },
  confirmText: { fontWeight: "bold", color: "#1A1A1A", fontSize: ms(14) },
});
