import { Platform } from "react-native";

// Shim de almacenamiento con API SÍNCRONA (igual que localStorage).
// - Web: usa window.localStorage real (persiste entre recargas).
// - Nativo (Android/iOS): usa un store en memoria durante la sesión.
let memoryStore = {};
const listeners = {};

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
    if (listeners[key]) {
      listeners[key].forEach((callback) => {
        try {
          callback(value);
        } catch (e) {
          console.warn("Error en listener de storage:", e);
        }
      });
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
    if (listeners[key]) {
      listeners[key].forEach((callback) => {
        try {
          callback(null);
        } catch (e) {
          console.warn("Error en listener de storage:", e);
        }
      });
    }
  },
  subscribe: (key, callback) => {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(callback);
  },
  unsubscribe: (key, callback) => {
    if (!listeners[key]) return;
    listeners[key] = listeners[key].filter((listener) => listener !== callback);
  },
};

export default storage;
