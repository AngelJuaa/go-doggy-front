import storage from "./storage";

export const CLIENT_NOTIFICATIONS_KEY = "cliente_notificaciones";

export const getClientNotifications = () => {
  try {
    const raw = storage.getItem(CLIENT_NOTIFICATIONS_KEY);
    const notifications = raw ? JSON.parse(raw) : [];
    return Array.isArray(notifications) ? notifications : [];
  } catch (error) {
    return [];
  }
};

export const addClientNotification = ({ title, subtitle, description, iconColor, iconText, servicioId }) => {
  const notification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    servicioId: Number(servicioId || 0),
    iconColor: iconColor || "#43A047",
    iconText: iconText || "📣",
    titulo: title,
    subtitulo: subtitle,
    descripcion: description,
    fecha: new Date().toLocaleString("es-MX"),
  };

  storage.setItem(
    CLIENT_NOTIFICATIONS_KEY,
    JSON.stringify([notification, ...getClientNotifications()].slice(0, 50))
  );

  return notification;
};
