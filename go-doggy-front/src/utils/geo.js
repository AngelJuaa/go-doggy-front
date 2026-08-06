import { Platform } from "react-native";

// Helper de geolocalización cross-platform.
// - Web: usa navigator.geolocation (del navegador).
// - Nativo (Android/iOS): usa expo-location (GPS real del dispositivo).

export async function requestLocationPermission() {
  if (Platform.OS === "web") {
    return !!(typeof navigator !== "undefined" && navigator.geolocation);
  }
  try {
    const Location = require("expo-location");
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  } catch (e) {
    console.warn("Permiso de ubicación:", e?.message);
    return false;
  }
}

// Obtiene la posición actual una vez. Devuelve {lat, lng} o null.
export async function getCurrentPosition() {
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }
  try {
    const Location = require("expo-location");
    // 1) Ãšltima ubicaciÃ³n conocida: instantÃ¡nea (ideal en emulador)
    let pos = await Location.getLastKnownPositionAsync();
    // 2) Si no hay, pedir una nueva (con timeout para no colgar la UI)
    if (!pos) {
      pos = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise((resolve) => setTimeout(() => resolve(null), 8000)),
      ]);
    }
    if (!pos || !pos.coords) return null;
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch (e) {
    console.warn("getCurrentPosition:", e?.message);
    return null;
  }
}

// Observa la posición en tiempo real. onUpdate({lat,lng}) en cada cambio.
// Devuelve un objeto con .remove() para detener el seguimiento.
export async function watchPosition(onUpdate, onError) {
  if (Platform.OS === "web") {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      onError && onError(new Error("Geolocalización no disponible"));
      return { remove: () => {} };
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => onUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => onError && onError(err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    return { remove: () => navigator.geolocation.clearWatch(id) };
  }
  try {
    const Location = require("expo-location");
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1500, // cada 1.5 s
        distanceInterval: 0, // siempre (necesario en emulador estático)
      },
      (pos) => onUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    );
    return sub; // expo-location subscription ya tiene .remove()
  } catch (e) {
    onError && onError(e);
    return { remove: () => {} };
  }
}
