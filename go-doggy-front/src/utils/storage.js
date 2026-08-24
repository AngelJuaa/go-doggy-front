import { Platform } from "react-native";

// Shim de almacenamiento con API SÍNCRONA.
// - Web: usa sessionStorage para aislar la sesión por pestaña/tab y evitar que dos
//   cuentas abiertas en paralelo compartan el mismo perfil.
// - Nativo: usa un store en memoria durante la sesión.
let memoryStore = {};
const listeners = {};

const getWebStore = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage || window.localStorage || null;
  } catch (e) {
    return null;
  }
};

const storage = {
  getItem: (key) => {
    if (Platform.OS === "web") {
      const webStore = getWebStore();
      try {
        return webStore ? webStore.getItem(key) : null;
      } catch (e) {
        return null;
      }
    }
    return key in memoryStore ? memoryStore[key] : null;
  },
  setItem: (key, value) => {
    if (Platform.OS === "web") {
      const webStore = getWebStore();
      try {
        if (webStore) {
          webStore.setItem(key, value);
        }
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
      const webStore = getWebStore();
      try {
        if (webStore) {
          webStore.removeItem(key);
        }
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
