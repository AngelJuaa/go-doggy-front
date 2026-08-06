import { Platform } from "react-native";

// En el emulador de Android, "localhost" apunta al propio emulador.
// El alias 10.0.2.2 redirige al localhost de tu PC (el host).
// En web e iOS, localhost funciona normal.
const HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

export const API_URL = `http://${HOST}:3000`;

export const apiFetch = async (endpoint, options = {}) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error en el servidor");
  return data;
};
