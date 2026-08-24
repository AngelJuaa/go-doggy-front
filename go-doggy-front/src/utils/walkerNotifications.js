import storage from "./storage";

export const WALKER_NOTIFICATIONS_KEY = "paseador_notificaciones";

export const getWalkerNotifications = () => {
  try {
    const raw = storage.getItem(WALKER_NOTIFICATIONS_KEY);
    const notifications = raw ? JSON.parse(raw) : [];
    return Array.isArray(notifications) ? notifications : [];
  } catch (error) {
    return [];
  }
};

export const addWalkerNotification = ({
  title,
  subtitle,
  description,
  iconColor,
  iconText,
  servicioId,
  details = {},
}) => {
  const notification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    servicioId: Number(servicioId || 0),
    iconColor: iconColor || "#43A047",
    iconText: iconText || "📣",
    titulo: title,
    subtitulo: subtitle,
    descripcion: description,
    detalles: details,
    fecha: new Date().toLocaleString("es-MX"),
  };

  storage.setItem(
    WALKER_NOTIFICATIONS_KEY,
    JSON.stringify([notification, ...getWalkerNotifications()].slice(0, 50))
  );

  return notification;
};
