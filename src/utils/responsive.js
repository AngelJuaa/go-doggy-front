import { Dimensions } from "react-native";

const { width: rawW, height: rawH } = Dimensions.get("window");

// En web/escritorio la ventana puede ser muy ancha y romper el escalado.
// Tratamos el diseño SIEMPRE como móvil limitando el ancho de referencia
// a 480px como máximo (y el alto a 900 cuando la ventana es ancha).
const W = Math.min(rawW, 480);
const H = rawW > 480 ? Math.min(rawH, 900) : rawH;

// Diseño base: iPhone 12 (390x844)
const BASE_W = 390;
const BASE_H = 844;

// Escala horizontal (anchos, bordes, padding lateral)
export const s = (size) => Math.round((W / BASE_W) * size);

// Escala vertical (alturas, padding vertical)
export const vs = (size) => Math.round((H / BASE_H) * size);

// Escala moderada para fuentes (no escala tan agresivo)
export const ms = (size, factor = 0.5) =>
  Math.round(size + (s(size) - size) * factor);

// Porcentaje del ancho / alto de referencia
export const wp = (pct) => Math.round((W * pct) / 100);
export const hp = (pct) => Math.round((H * pct) / 100);

export const SCREEN_W = W;
export const SCREEN_H = H;
