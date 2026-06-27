import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { s, vs, ms } from "../utils/responsive";

const CONFIG = {
  success: { bg: "#4CAF50", icon: "✓" },
  error:   { bg: "#E53935", icon: "✗" },
  warning: { bg: "#FF9800", icon: "⚠" },
  info:    { bg: "#1E88E5", icon: "ℹ" },
};

export default function Toast({ visible, message, type = "info", onHide }) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    translateY.setValue(-120);
    opacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(2600),
      Animated.parallel([
        Animated.timing(translateY, { toValue: -120, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 0,    duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => onHide?.());
  }, [visible]);

  if (!visible) return null;

  const { bg, icon } = CONFIG[type] ?? CONFIG.info;

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: bg, transform: [{ translateY }], opacity }]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.text} numberOfLines={3}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: vs(52),
    left: s(16),
    right: s(16),
    flexDirection: "row",
    alignItems: "center",
    borderRadius: s(14),
    paddingVertical: vs(12),
    paddingHorizontal: s(16),
    zIndex: 9999,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  icon: { fontSize: ms(18), color: "#fff", marginRight: s(10), fontWeight: "bold" },
  text: { flex: 1, color: "#fff", fontSize: ms(13), fontWeight: "600", lineHeight: ms(18) },
});
