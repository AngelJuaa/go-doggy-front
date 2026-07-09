import { io } from "socket.io-client";
import { API_URL } from "./api";

// Singleton: una sola instancia en toda la app
let socket = null;

// Store global de solicitud pendiente — persiste aunque InicioPaseador desmonte
let _pendingRequest = null;
const _subscribers = new Set();

export const getPendingRequest  = ()    => _pendingRequest;
export const clearPendingRequest = ()   => { _pendingRequest = null; _subscribers.forEach(fn => fn(null)); };
export const subscribePending   = (fn)  => {
  _subscribers.add(fn);
  return () => _subscribers.delete(fn);
};

export const getSocket = () => {
  if (!socket) {
    socket = io(API_URL, { transports: ["websocket", "polling"] });
    // Listener permanente: guarda la solicitud aunque InicioPaseador no esté montado
    socket.on("servicio:nuevo", (data) => {
      _pendingRequest = data;
      _subscribers.forEach(fn => fn(data));
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
