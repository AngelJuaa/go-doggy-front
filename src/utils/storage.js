import { Platform } from "react-native";

// Shim de almacenamiento con API SÍNCRONA (igual que localStorage).
// - Web: usa window.localStorage real (persiste entre recargas).
// - Nativo (Android/iOS): usa un store en memoria durante la sesión.
let memoryStore = {};

const storage = {
  getItem: (key) => {
    if (Platform.OS === "web") {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    }
    return key in memoryStore ? memoryStore[key] : null;
  },
  setItem: (key, value) => {
    if (Platform.OS === "web") {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {}
    } else {
      memoryStore[key] = String(value);
    }
  },
  removeItem: (key) => {
    if (Platform.OS === "web") {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {}
    } else {
      delete memoryStore[key];
    }
  },
};

export default storage;
