import { io } from "socket.io-client";
import { API_URL } from "./api";

// Singleton: una sola instancia en toda la app
let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_URL, { transports: ["websocket", "polling"] });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
