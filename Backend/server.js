const express = require('express');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// middlewares
app.use(cors());
app.use(express.json());

// 📁 Crear directorio uploads si no existe
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 📁 servir imágenes
app.use('/uploads', express.static('uploads'));

const UPLOADS_DIR = path.resolve('uploads');

async function removeUploadedFile(filename) {
  if (!filename) return;

  const safeName = path.basename(String(filename));
  const filePath = path.join(UPLOADS_DIR, safeName);

  try {
    await fs.promises.unlink(filePath);
    console.log(`🧹 Archivo eliminado: ${safeName}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`⚠️ Archivo no encontrado en uploads: ${safeName}`);
      return;
    }
    console.warn(`⚠️ No se pudo eliminar archivo ${safeName}:`, error.message);
  }
}

// ========================
// CONFIG MULTER
// ========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const nombreUnico = Date.now() + path.extname(file.originalname);
    cb(null, nombreUnico);
  }
});

const upload = multer({ storage });

// ========================
// CONEXIÓN BD
// ========================
const db = new Pool({
  host: '127.0.0.1',
  user: 'postgres',
  password: 'postgres',
  database: 'GoDoggy',
  port: 5432
});

// Presencia efimera: no modifica la base de datos. Solo se usa para asignar
// solicitudes a paseadores conectados que reportan su GPS actual.
const paseadoresEnLinea = new Map();
const busquedasServicio = new Map();
const etapasServicio = new Map();
const esperaEntregaInicialTimers = new Map();
const esperaEntregaFinalTimers = new Map();
const SEARCH_RETRY_INTERVAL_MS = 1000;
const SEARCH_RADIUS_METERS = 500;
const PICKUP_RADIUS_METERS = 250;
const RETURN_NOTICE_RADIUS_METERS = 100;
const ESPERA_ENTREGA_INICIAL_MS = 5 * 60 * 1000;
const ESPERA_ENTREGA_FINAL_MS = 2 * 60 * 1000;
const codigosVerificacion = new Map();
const VERIFICATION_TTL_MS = 10 * 60 * 1000;

const obtenerTransportadorCorreo = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP no configurado. Define SMTP_HOST, SMTP_USER y SMTP_PASS.');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: String(SMTP_PORT || '') === '465',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
};

const enviarCodigoVerificacion = async ({ correo, tipo, proposito = 'verificacion' }) => {
  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  const expiraEn = Date.now() + VERIFICATION_TTL_MS;
  const transportador = obtenerTransportadorCorreo();
  const remitente = process.env.SMTP_FROM || process.env.SMTP_USER;
  const nombreRol = tipo === 'paseador' ? 'paseador' : 'cliente';

  await transportador.sendMail({
    from: remitente,
    to: correo,
    subject: 'Código de verificación GoDoggy',
    text: `Tu código de verificación para GoDoggy como ${nombreRol} es: ${codigo}. Expira en 10 minutos.`,
    html: `<p>Tu código de verificación para GoDoggy como <strong>${nombreRol}</strong> es:</p><h2>${codigo}</h2><p>Expira en 10 minutos.</p>`,
  });

  codigosVerificacion.set(`${proposito}:${nombreRol}:${correo.toLowerCase()}`, { codigo, expiraEn });
};

const distanciaEnMetros = (latA, lngA, latB, lngB) => {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const deltaLat = toRadians(latB - latA);
  const deltaLng = toRadians(lngB - lngA);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(deltaLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const limpiarBusquedaServicio = (servicioId) => {
  const busqueda = busquedasServicio.get(Number(servicioId));
  if (busqueda?.timeoutId) clearTimeout(busqueda.timeoutId);
  if (busqueda?.retryIntervalId) clearInterval(busqueda.retryIntervalId);
  busquedasServicio.delete(Number(servicioId));
};

const cargarSolicitudParaPaseador = async (servicioId) => {
  const result = await db.query(
    `
      SELECT s.servicio_id, s.dueno_id, s.direccion_id, s.tipo_servicio, s.duracion_minutos, s.notas_dueno,
             u.nombre_completo AS dueno_nombre, d.latitud, d.longitud,
             COALESCE(json_agg(DISTINCT jsonb_build_object('mascota_id', m.mascota_id, 'mascota_nombre', m.nombre))
               FILTER (WHERE m.mascota_id IS NOT NULL), '[]'::json) AS mascotas
      FROM servicio s
      JOIN usuario u ON u.usuario_id = s.dueno_id
      JOIN direccion d ON d.direccion_id = s.direccion_id
      LEFT JOIN servicio_multiple_mascotas smm ON smm.servicio_id = s.servicio_id
      LEFT JOIN mascota m ON m.mascota_id = smm.mascota_id
      WHERE s.servicio_id = $1 AND s.estado = 'esperando' AND s.paseador_id IS NULL
      GROUP BY s.servicio_id, u.nombre_completo, d.latitud, d.longitud
    `,
    [servicioId]
  );
  return result.rows[0] || null;
};

const enviarSiguientePaseador = async (servicioId) => {
  const busqueda = busquedasServicio.get(Number(servicioId));
  if (!busqueda) return;

  const solicitud = await cargarSolicitudParaPaseador(servicioId);
  if (!solicitud) return;

  // La búsqueda pudo cancelarse mientras se consultaba la base de datos.
  if (busquedasServicio.get(Number(servicioId)) !== busqueda) return;

  const latitud = Number(solicitud.latitud);
  const longitud = Number(solicitud.longitud);
  console.log('[Busqueda servicio] Ubicacion del cliente', {
    servicioId,
    latitud,
    longitud,
    direccionId: solicitud.direccion_id,
  });
  if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) return;

  const candidatos = [...paseadoresEnLinea.values()]
    .filter((paseador) => !busqueda.intentados.has(paseador.paseadorId))
    .map((paseador) => ({
      ...paseador,
      distancia: distanciaEnMetros(latitud, longitud, paseador.lat, paseador.lng),
    }))
    .filter((paseador) => paseador.distancia <= SEARCH_RADIUS_METERS)
    .sort((a, b) => a.distancia - b.distancia);

  if (candidatos.length === 0) {
    if (!busqueda.ultimoLogSinCandidato || Date.now() - busqueda.ultimoLogSinCandidato > 5000) {
      busqueda.ultimoLogSinCandidato = Date.now();
      console.log('[Busqueda servicio] Sin paseadores dentro de 500 m', {
        servicioId,
        paseadoresConectados: paseadoresEnLinea.size,
          paseadores: [...paseadoresEnLinea.values()].map((paseador) => ({
            paseadorId: paseador.paseadorId,
            lat: paseador.lat,
            lng: paseador.lng,
          })),
      });
    }
    return;
  }

  candidatos.forEach((candidato) => {
    const paseadorActual = paseadoresEnLinea.get(candidato.paseadorId);
    if (!paseadorActual || paseadorActual.socketId !== candidato.socketId) return;

    console.log('[Busqueda servicio] Enviando solicitud', {
      servicioId,
      paseadorId: candidato.paseadorId,
      distanciaMetros: Math.round(candidato.distancia),
    });
    busqueda.intentados.add(candidato.paseadorId);
    io.to(`paseador_${candidato.paseadorId}`).emit('servicio:nuevo', {
      ...solicitud,
      mascota_nombre: (solicitud.mascotas || []).map((item) => item.mascota_nombre).join(', '),
      lat: latitud,
      lng: longitud,
    });
  });
};

const iniciarBusquedaServicio = (servicioId, duenoId) => {
  limpiarBusquedaServicio(servicioId);

  const retryIntervalId = setInterval(() => {
    enviarSiguientePaseador(servicioId).catch((error) => console.error('Error reintentando búsqueda:', error));
  }, SEARCH_RETRY_INTERVAL_MS);
  busquedasServicio.set(Number(servicioId), {
    duenoId: Number(duenoId),
    retryIntervalId,
    intentados: new Set(),
  });
  enviarSiguientePaseador(servicioId).catch((error) => console.error('Error buscando paseador:', error));
};

const obtenerContextoServicio = async (servicioId) => {
  const result = await db.query(
    `
      SELECT s.servicio_id, s.dueno_id, s.paseador_id, s.duracion_minutos, s.hora_inicio, s.estado, d.latitud, d.longitud
      FROM servicio s
      JOIN direccion d ON d.direccion_id = s.direccion_id
      WHERE s.servicio_id = $1
    `,
    [servicioId]
  );
  return result.rows[0] || null;
};

const obtenerEtapaServicio = (servicioId) => {
  const key = Number(servicioId);
  if (!etapasServicio.has(key)) {
    etapasServicio.set(key, {
      etapa: 'recogida',
      llegadaInicialNotificada: false,
      recogidaConfirmada: false,
      clienteRecibimientoConfirmado: false,
      paseadorRecibimientoConfirmado: false,
      regresoNotificado: false,
      entregaRecordatorioNotificado: false,
    });
  }
  return etapasServicio.get(key);
};

const detenerEsperaEntregaInicial = (servicioId) => {
  const timer = esperaEntregaInicialTimers.get(Number(servicioId));
  if (timer) clearInterval(timer);
  esperaEntregaInicialTimers.delete(Number(servicioId));
};

const segundosRestantesEntregaInicial = (servicioId) => {
  const inicio = obtenerEtapaServicio(servicioId).inicioEsperaEntrega;
  if (!inicio) return null;
  return Math.max(0, Math.ceil((inicio + ESPERA_ENTREGA_INICIAL_MS - Date.now()) / 1000));
};

const iniciarEsperaEntregaInicial = (servicioId, contexto) => {
  detenerEsperaEntregaInicial(servicioId);
  const inicio = Date.now();
  obtenerEtapaServicio(servicioId).inicioEsperaEntrega = inicio;
  const enviarSolicitud = () => {
    const segundosRestantes = Math.max(
      0,
      Math.ceil((inicio + ESPERA_ENTREGA_INICIAL_MS - Date.now()) / 1000)
    );

    if (segundosRestantes === 0) {
      detenerEsperaEntregaInicial(servicioId);
      db.query(
        `UPDATE servicio
         SET estado = 'cancelado', hora_fin = NOW(),
             costo_total = COALESCE(NULLIF(costo_total, 0), (
               SELECT tarifa_base_hora FROM paseador WHERE paseador_id = servicio.paseador_id
             )),
             penalizacion_entrega = TRUE
         WHERE servicio_id = $1 AND estado = 'en_camino'`,
        [servicioId]
      ).then((resultado) => {
        if (!resultado.rowCount) return;
        etapasServicio.delete(Number(servicioId));
        const payload = {
          servicio_id: Number(servicioId),
          penalizacion_entrega: true,
          mensaje_cliente: 'Por retraso de entrega, se te hizo el cobro correspondiente.',
          mensaje_paseador: 'El viaje fue cancelado porque el cliente no entregó las mascotas. Conservas la tarifa base menos el 20%.',
        };
        io.to(`cliente_${contexto.dueno_id}`).emit('servicio:cancelado', payload);
        io.to(`paseador_${contexto.paseador_id}`).emit('servicio:cancelado', payload);
      }).catch((error) => console.error('Error cancelando por falta de entrega:', error));
      return;
    }

    io.to(`paseador_${contexto.paseador_id}`).emit('paseador:recogida:recordatorio', {
      servicio_id: Number(servicioId),
      segundos_restantes: segundosRestantes,
    });
    io.to(`cliente_${contexto.dueno_id}`).emit('cliente:entrega:solicitud', {
      servicio_id: Number(servicioId),
      fase: 'recogida',
      segundos_restantes: segundosRestantes,
    });
  };

  enviarSolicitud();
  esperaEntregaInicialTimers.set(Number(servicioId), setInterval(enviarSolicitud, 60 * 1000));
};

const detenerEsperaEntregaFinal = (servicioId) => {
  const timer = esperaEntregaFinalTimers.get(Number(servicioId));
  if (timer) clearInterval(timer);
  esperaEntregaFinalTimers.delete(Number(servicioId));
};

const iniciarEsperaEntregaFinal = (servicioId, contexto) => {
  detenerEsperaEntregaFinal(servicioId);
  const inicio = Date.now();
  const enviarAviso = () => {
    const segundosRestantes = Math.max(
      0,
      Math.ceil((inicio + ESPERA_ENTREGA_FINAL_MS - Date.now()) / 1000)
    );

    if (segundosRestantes === 0) {
      detenerEsperaEntregaFinal(servicioId);
      db.query(
        `UPDATE servicio
         SET estado = 'completado', hora_fin = COALESCE(hora_fin, NOW())
         WHERE servicio_id = $1 AND estado = 'activo'`,
        [servicioId]
      ).then((resultado) => {
        if (!resultado.rowCount) return;
        etapasServicio.delete(Number(servicioId));
        const payload = {
          servicio_id: Number(servicioId),
          mensaje_paseador: 'Tienes 1 hora para entregar a las mascotas pendientes, de lo contrario se alertará a las autoridades competentes.',
          mensaje_cliente: 'El paseador ha sido alertado, tiene 1 hora para la entrega de tus mascotas.',
        };
        io.to(`paseador_${contexto.paseador_id}`).emit('paseador:entrega:alerta', payload);
        io.to(`cliente_${contexto.dueno_id}`).emit('cliente:entrega:alerta', payload);
        io.to(`servicio_${servicioId}`).emit('servicio:entrega:forzada', payload);
      }).catch((error) => console.error('Error cerrando prorroga de entrega:', error));
      return;
    }

    io.to(`paseador_${contexto.paseador_id}`).emit('paseador:entrega:prorroga', {
      servicio_id: Number(servicioId),
      segundos_restantes: segundosRestantes,
    });
    io.to(`cliente_${contexto.dueno_id}`).emit('cliente:entrega:prorroga', {
      servicio_id: Number(servicioId),
      segundos_restantes: segundosRestantes,
    });
  };

  enviarAviso();
  esperaEntregaFinalTimers.set(Number(servicioId), setInterval(enviarAviso, 60 * 1000));
};

const activarPaseoSiAmbosConfirman = async (servicioId, contexto) => {
  const etapa = obtenerEtapaServicio(servicioId);
  if (!etapa.clienteRecibimientoConfirmado || !etapa.paseadorRecibimientoConfirmado) return false;

  detenerEsperaEntregaInicial(servicioId);
  const actualizacion = await db.query(
    `UPDATE servicio
     SET estado = 'activo', hora_inicio = COALESCE(hora_inicio, NOW())
     WHERE servicio_id = $1 AND estado = 'en_camino'`,
    [servicioId]
  );
  if (!actualizacion.rowCount) return false;

  etapa.etapa = 'paseando';
  etapa.inicioPaseoAt = new Date();
  io.to(`paseador_${contexto.paseador_id}`).emit('paseador:mascotas:entregadas', { servicio_id: servicioId });
  io.to(`cliente_${contexto.dueno_id}`).emit('cliente:servicio:activo', { servicio_id: servicioId });
  return true;
};

const procesarProximidadServicio = async (servicioId, lat, lng) => {
  const contexto = await obtenerContextoServicio(servicioId);
  if (!contexto) return;
  if (contexto.estado !== 'en_camino') return;

  const destinoLat = Number(contexto.latitud);
  const destinoLng = Number(contexto.longitud);
  if (!Number.isFinite(destinoLat) || !Number.isFinite(destinoLng)) return;

  const distancia = distanciaEnMetros(Number(lat), Number(lng), destinoLat, destinoLng);
  const etapa = obtenerEtapaServicio(servicioId);

  if (etapa.etapa === 'recogida' && !etapa.llegadaInicialNotificada && distancia <= PICKUP_RADIUS_METERS) {
    etapa.llegadaInicialNotificada = true;
    etapa.recogidaConfirmada = true;
    iniciarEsperaEntregaInicial(servicioId, contexto);
    io.to(`cliente_${contexto.dueno_id}`).emit('cliente:paseador:llego-recogida', { servicio_id: Number(servicioId) });
    io.to(`cliente_${contexto.dueno_id}`).emit('cliente:entrega:solicitud', {
      servicio_id: Number(servicioId),
      fase: 'recogida',
    });
    io.to(`paseador_${contexto.paseador_id}`).emit('paseador:recogida:confirmar', { servicio_id: Number(servicioId) });
    return;
  }

  if (etapa.etapa === 'paseando' && !etapa.regresoNotificado && distancia <= RETURN_NOTICE_RADIUS_METERS) {
    etapa.regresoNotificado = true;
    io.to(`cliente_${contexto.dueno_id}`).emit('cliente:paseador:por-llegar', { servicio_id: Number(servicioId) });
  }

  if (
    etapa.etapa === 'paseando' &&
    !etapa.entregaRecordatorioNotificado &&
    distancia <= RETURN_NOTICE_RADIUS_METERS
  ) {
    const inicio = contexto.hora_inicio ? new Date(contexto.hora_inicio).getTime() : NaN;
    const duracionSegundos = Math.max(0, Number(contexto.duracion_minutos) || 0) * 60;
    const segundosRestantes = Number.isFinite(inicio) && duracionSegundos > 0
      ? duracionSegundos - Math.floor((Date.now() - inicio) / 1000)
      : null;

    if (segundosRestantes !== null && segundosRestantes >= 0 && segundosRestantes <= 20) {
      etapa.entregaRecordatorioNotificado = true;
      io.to(`paseador_${contexto.paseador_id}`).emit('paseador:entrega:recordatorio', {
        servicio_id: Number(servicioId),
        segundos_restantes: segundosRestantes,
      });
    }
  }
};

const calcularDistanciaRecorrida = (puntos) => {
  let distanciaTotal = 0;
  let puntoAnterior = null;

  for (const punto of puntos) {
    const latitud = Number(punto.latitud);
    const longitud = Number(punto.longitud);
    const timestamp = new Date(punto.timestamp_registro).getTime();
    if (!Number.isFinite(latitud) || !Number.isFinite(longitud) || !Number.isFinite(timestamp)) continue;

    const puntoActual = { latitud, longitud, timestamp };
    if (!puntoAnterior) {
      puntoAnterior = puntoActual;
      continue;
    }

    const distanciaSegmento = distanciaEnMetros(
      puntoAnterior.latitud,
      puntoAnterior.longitud,
      puntoActual.latitud,
      puntoActual.longitud
    );
    const segundos = Math.max(0, (puntoActual.timestamp - puntoAnterior.timestamp) / 1000);
    const velocidad = segundos > 0 ? distanciaSegmento / segundos : Infinity;

    // Ignora ruido inmóvil, velocidades incompatibles con un paseo y saltos GPS bruscos.
    if (
      distanciaSegmento >= 3 &&
      velocidad <= 15 &&
      !(distanciaSegmento > 500 && segundos < 60)
    ) {
      distanciaTotal += distanciaSegmento;
    }

    puntoAnterior = puntoActual;
  }

  return Math.round(distanciaTotal);
};


db.connect()
  .then(() => console.log('Conectado a PostgreSQL 🚀'))
  .catch(err => console.error('Error de conexión:', err));

db.query('ALTER TABLE direccion ADD COLUMN IF NOT EXISTS numero_interior VARCHAR(20)')
  .catch(error => console.warn('No se pudo verificar la columna numero_interior:', error.message));
db.query('ALTER TABLE calificacion ADD COLUMN IF NOT EXISTS categoria VARCHAR(30)')
  .catch(error => console.warn('No se pudo verificar la columna categoria:', error.message));
db.query('ALTER TABLE servicio ADD COLUMN IF NOT EXISTS distancia_metros NUMERIC(10,2) DEFAULT 0')
  .catch(error => console.warn('No se pudo verificar la columna distancia_metros:', error.message));
db.query('ALTER TABLE servicio ADD COLUMN IF NOT EXISTS penalizacion_entrega BOOLEAN NOT NULL DEFAULT FALSE')
  .catch(error => console.warn('No se pudo verificar la penalizacion de entrega:', error.message));
db.query(`
  ALTER TABLE servicio ALTER COLUMN mascota_id DROP NOT NULL;
  ALTER TABLE servicio DROP CONSTRAINT IF EXISTS servicio_mascota_id_fkey;
  ALTER TABLE servicio
    ADD CONSTRAINT servicio_mascota_id_fkey
    FOREIGN KEY (mascota_id) REFERENCES mascota(mascota_id) ON DELETE SET NULL;
`).catch(error => console.warn('No se pudo actualizar la relacion servicio-mascota:', error.message));

const HTTP_HEADERS = {
  'User-Agent': 'GoDoggy/1.0 (postal lookup)',
  Accept: 'application/json'
};

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...HTTP_HEADERS,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} al consultar ${url}`);
  }

  return response.json();
}

async function fetchJsonSafe(url, options = {}) {
  try {
    return await fetchJson(url, options);
  } catch (error) {
    console.warn(`⚠️ Fuente no disponible: ${url} -> ${error.message}`);
    return null;
  }
}

async function queryOverpass(overpassQuery) {
  const endpoint = 'https://overpass-api.de/api/interpreter';

  // Intento 1: POST form-urlencoded (formato mas estable en Overpass)
  const postForm = await fetchJsonSafe(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: `data=${encodeURIComponent(overpassQuery)}`,
  });

  if (postForm?.elements) {
    return postForm;
  }

  // Intento 2: GET con querystring completa
  const getUrl = `${endpoint}?data=${encodeURIComponent(overpassQuery)}`;
  const getData = await fetchJsonSafe(getUrl);
  return getData || { elements: [] };
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()))].sort((a, b) =>
    a.localeCompare(b, 'es', { sensitivity: 'base' })
  );
}

async function lookupPostalCode(postalCode) {
  const zipData = await fetchJsonSafe(`https://api.zippopotam.us/mx/${postalCode}`);
  const places = Array.isArray(zipData?.places) ? zipData.places : [];

  const nominatimData = await fetchJsonSafe(
    `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(postalCode)}&country=Mexico&format=jsonv2&addressdetails=1&limit=1`
  );

  const address = nominatimData?.[0]?.address || {};
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.city_district ||
    address.county ||
    places[0]?.['place name'] ||
    null;

  const coloniasDesdeZip = uniqueSorted(places.map((place) => place['place name']));
  const coloniasDesdeNominatim = uniqueSorted([
    address.suburb,
    address.neighbourhood,
    address.quarter,
    address.city_district,
  ]);
  const colonias = coloniasDesdeZip.length > 0 ? coloniasDesdeZip : coloniasDesdeNominatim;

  const pais = zipData?.country || address.country || 'Mexico';
  const estado = places[0]?.state || address.state || '';

  if (!pais && !estado && !city && colonias.length === 0) {
    throw new Error('CP_NO_ENCONTRADO');
  }

  return {
    codigo_postal: zipData?.['post code'] || address.postcode || postalCode,
    pais,
    estado,
    ciudad: city || '',
    colonias,
    latitud: nominatimData?.[0]?.lat ? Number(nominatimData[0].lat) : null,
    longitud: nominatimData?.[0]?.lon ? Number(nominatimData[0].lon) : null,
    boundingbox: nominatimData?.[0]?.boundingbox || null,
  };
}

async function lookupStreets({ postalCode, country, state, city, colonia }) {
  const queryParts = [colonia, city, state, country, postalCode].filter(Boolean);
  const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryParts.join(', '))}&format=jsonv2&addressdetails=1&limit=1`;
  const postalSearchUrl = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(postalCode)}&country=${encodeURIComponent(country || 'Mexico')}&format=jsonv2&addressdetails=1&limit=1`;

  const nominatimMain = await fetchJsonSafe(searchUrl);
  const nominatimPostal = await fetchJsonSafe(postalSearchUrl);

  const boundingbox = nominatimMain?.[0]?.boundingbox || nominatimPostal?.[0]?.boundingbox;
  const latFallback = Number(nominatimMain?.[0]?.lat || nominatimPostal?.[0]?.lat);
  const lngFallback = Number(nominatimMain?.[0]?.lon || nominatimPostal?.[0]?.lon);

  let streets = [];

  if (boundingbox && boundingbox.length === 4) {
    const [south, north, west, east] = boundingbox;
    const overpassBBoxQuery = `
      [out:json][timeout:25];
      way[highway][name](${south},${west},${north},${east});
      out tags;
    `;

    const overpassBBox = await queryOverpass(overpassBBoxQuery);

    streets = uniqueSorted((overpassBBox?.elements || []).map((element) => element?.tags?.name));
  }

  // Fallback: consulta por radio alrededor del punto central para colonias/CP donde el bbox no trae vias.
  if (streets.length === 0 && Number.isFinite(latFallback) && Number.isFinite(lngFallback)) {
    const overpassAroundQuery = `
      [out:json][timeout:25];
      way[highway][name](around:3500,${latFallback},${lngFallback});
      out tags;
    `;

    const overpassAround = await queryOverpass(overpassAroundQuery);

    streets = uniqueSorted((overpassAround?.elements || []).map((element) => element?.tags?.name));
  }

  return streets;
}

async function lookupAddressCoordinates({ calle, numero_calle, numero_externo, colonia, ciudad, estado, pais, codigo_postal }) {
  const parts = [];
  if (numero_calle) parts.push(numero_calle);
  if (calle) parts.push(calle);
  if (numero_externo && !numero_calle) parts.push(numero_externo);
  if (colonia) parts.push(colonia);
  if (ciudad) parts.push(ciudad);
  if (estado) parts.push(estado);
  if (pais) parts.push(pais);
  if (codigo_postal) parts.push(codigo_postal);

  const query = parts.filter(Boolean).join(', ');
  if (!query) return null;

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&limit=1`;
  const results = await fetchJsonSafe(url);
  const first = Array.isArray(results) ? results[0] : null;

  if (!first) return null;

  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return { lat, lon };
}

app.get('/direccion/geocode', async (req, res) => {
  const { calle, numero_calle, numero_externo, colonia, ciudad, estado, pais, codigo_postal } = req.query;

  try {
    const coords = await lookupAddressCoordinates({ calle, numero_calle, numero_externo, colonia, ciudad, estado, pais, codigo_postal });
    if (!coords) {
      return res.status(404).json({ message: 'No se encontraron coordenadas para esta direccion' });
    }

    return res.json({ latitude: coords.lat, longitude: coords.lon });
  } catch (error) {
    console.error('❌ Error geocodificando direccion:', error);
    return res.status(500).json({ message: 'No se pudo geocodificar la direccion' });
  }
});

app.get('/direccion/codigo-postal/:codigoPostal', async (req, res) => {
  const { codigoPostal } = req.params;

  if (!/^\d{5}$/.test(codigoPostal)) {
    return res.status(400).json({ message: 'Codigo postal invalido' });
  }

  try {
    const lookup = await lookupPostalCode(codigoPostal);
    res.json(lookup);
  } catch (error) {
    console.error('❌ Error buscando codigo postal:', error.message);
    if (error.message === 'CP_NO_ENCONTRADO') {
      return res.status(404).json({ message: 'Codigo postal no encontrado' });
    }
    res.status(500).json({ message: 'No se pudo consultar el codigo postal' });
  }
});

app.get('/direccion/calles', async (req, res) => {
  const { codigo_postal, pais, estado, ciudad, colonia } = req.query;

  if (!codigo_postal || !pais || !estado || !ciudad) {
    return res.status(400).json({ message: 'Faltan datos para consultar calles' });
  }

  try {
    const calles = await lookupStreets({
      postalCode: codigo_postal,
      country: pais,
      state: estado,
      city: ciudad,
      colonia,
    });

    res.json({ calles });
  } catch (error) {
    console.error('❌ Error buscando calles:', error.message);
    res.status(500).json({ message: 'No se pudieron consultar las calles' });
  }
});

app.get('/direccion/usuario/:usuarioId', async (req, res) => {
  const usuarioId = Number(req.params.usuarioId);

  if (!usuarioId) {
    return res.status(400).json({ message: 'usuarioId invalido' });
  }

  try {
    const result = await db.query(
      `
        SELECT *
        FROM direccion
        WHERE usuario_id = $1
        ORDER BY direccion_id DESC
      `,
      [usuarioId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error obteniendo direcciones por usuario:', error);
    res.status(500).json({ message: 'No se pudieron obtener las direcciones' });
  }
});

app.post('/direccion', async (req, res) => {
  const {
    usuario_id,
    codigo_postal,
    pais,
    estado,
    ciudad,
    colonia,
    calle,
    numero_calle,
    numero_externo,
    numero_interior,
    referencias_casa,
    latitud,
    longitud,
  } = req.body;

  const usuarioId = Number(usuario_id);

  const lat = Number(latitud);
  const lng = Number(longitud);

  const requiredFields = {
    usuario_id,
    codigo_postal,
    pais,
    estado,
    ciudad,
    colonia,
    calle,
    numero_calle,
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([, value]) => !String(value || '').trim())
    .map(([key]) => key);

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: 'Faltan datos para guardar la direccion',
      missingFields,
    });
  }

  if (!usuarioId) {
    return res.status(400).json({ message: 'usuario_id invalido' });
  }

  if (!/^\d{5}$/.test(String(codigo_postal || ''))) {
    return res.status(400).json({ message: 'codigo_postal invalido' });
  }

  try {
    const columnsResult = await db.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'direccion'
      `,
    );

    const availableColumns = new Set(columnsResult.rows.map((row) => row.column_name));

    const columns = [
      'usuario_id',
      'codigo_postal',
      'pais',
      'estado',
      'ciudad',
      'colonia',
      'calle',
      'numero_calle',
      'latitud',
      'longitud',
    ];

    let finalLat = Number.isFinite(lat) ? lat : 0;
    let finalLng = Number.isFinite(lng) ? lng : 0;

    if ((finalLat === 0 && finalLng === 0) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      const geocoded = await lookupAddressCoordinates({
        calle,
        numero_calle,
        numero_externo,
        colonia,
        ciudad,
        estado,
        pais,
        codigo_postal,
      });
      if (geocoded) {
        finalLat = geocoded.lat;
        finalLng = geocoded.lon;
      }
    }

    const values = [
      usuarioId,
      String(codigo_postal).trim(),
      String(pais).trim(),
      String(estado).trim(),
      String(ciudad).trim(),
      String(colonia).trim(),
      String(calle).trim(),
      String(numero_calle).trim(),
      finalLat,
      finalLng,
    ];

    if (availableColumns.has('numero_externo')) {
      columns.push('numero_externo');
      values.push(String(numero_externo || '').trim() || null);
    }

    if (availableColumns.has('numero_interior')) {
      columns.push('numero_interior');
      values.push(String(numero_interior || '').trim() || null);
    }

    if (availableColumns.has('referencias_Casa')) {
      columns.push('referencias_Casa');
      values.push(String(referencias_casa || '').trim() || null);
    }

    const placeholders = values.map((_, index) => `$${index + 1}`);
    const quotedColumns = columns.map((column) => `"${column.replace(/"/g, '""')}"`);

    const insertSql = `
      INSERT INTO direccion (${quotedColumns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING direccion_id
    `;

    const result = await db.query(insertSql, values);

    return res.status(201).json({
      message: 'Direccion guardada correctamente',
      direccion_id: result.rows[0].direccion_id,
    });
  } catch (error) {
    console.error('❌ Error guardando direccion:', error);
    return res.status(500).json({ message: 'No se pudo guardar la direccion' });
  }
});

app.put('/direccion/:direccionId', async (req, res) => {
  const direccionId = Number(req.params.direccionId);
  const {
    codigo_postal,
    pais,
    estado,
    ciudad,
    colonia,
    calle,
    numero_calle,
    numero_externo,
    numero_interior,
    referencias_casa,
    latitud,
    longitud,
  } = req.body;

  if (!direccionId) {
    return res.status(400).json({ message: 'direccionId invalido' });
  }

  const requiredFields = {
    codigo_postal,
    pais,
    estado,
    ciudad,
    colonia,
    calle,
    numero_calle,
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([, value]) => !String(value || '').trim())
    .map(([key]) => key);

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: 'Faltan datos para actualizar la direccion',
      missingFields,
    });
  }

  try {
    const columnsResult = await db.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'direccion'
      `,
    );

    const availableColumns = new Set(columnsResult.rows.map((row) => row.column_name));

    const columns = [
      'codigo_postal',
      'pais',
      'estado',
      'ciudad',
      'colonia',
      'calle',
      'numero_calle',
      'latitud',
      'longitud',
    ];

    let finalLat = Number(latitud);
    let finalLng = Number(longitud);

    if (!Number.isFinite(finalLat)) finalLat = 0;
    if (!Number.isFinite(finalLng)) finalLng = 0;

    if ((finalLat === 0 && finalLng === 0) || !Number.isFinite(latitud) || !Number.isFinite(longitud)) {
      const geocoded = await lookupAddressCoordinates({
        calle,
        numero_calle,
        numero_externo,
        colonia,
        ciudad,
        estado,
        pais,
        codigo_postal,
      });
      if (geocoded) {
        finalLat = geocoded.lat;
        finalLng = geocoded.lon;
      }
    }

    const values = [
      String(codigo_postal).trim(),
      String(pais).trim(),
      String(estado).trim(),
      String(ciudad).trim(),
      String(colonia).trim(),
      String(calle).trim(),
      String(numero_calle).trim(),
      finalLat,
      finalLng,
    ];

    if (availableColumns.has('numero_externo')) {
      columns.push('numero_externo');
      values.push(String(numero_externo || '').trim() || null);
    }

    if (availableColumns.has('numero_interior')) {
      columns.push('numero_interior');
      values.push(String(numero_interior || '').trim() || null);
    }

    if (availableColumns.has('referencias_Casa')) {
      columns.push('referencias_Casa');
      values.push(String(referencias_casa || '').trim() || null);
    }

    const setClause = columns
      .map((column, index) => `"${column.replace(/"/g, '""')}" = $${index + 1}`)
      .join(', ');

    const result = await db.query(
      `
        UPDATE direccion
        SET ${setClause}
        WHERE direccion_id = $${values.length + 1}
        RETURNING *
      `,
      [...values, direccionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Direccion no encontrada' });
    }

    return res.json({
      message: 'Direccion actualizada correctamente',
      direccion: result.rows[0],
    });
  } catch (error) {
    console.error('❌ Error actualizando direccion:', error);
    return res.status(500).json({ message: 'No se pudo actualizar la direccion' });
  }
});

app.delete('/direccion/:direccionId', async (req, res) => {
  const direccionId = Number(req.params.direccionId);

  if (!direccionId) {
    return res.status(400).json({ message: 'direccionId invalido' });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const serviciosResult = await client.query(
      'SELECT servicio_id FROM servicio WHERE direccion_id = $1',
      [direccionId]
    );

    const servicioIds = serviciosResult.rows.map((row) => row.servicio_id);

    if (servicioIds.length > 0) {
      await client.query(
        'DELETE FROM seguimientogps WHERE servicio_id = ANY($1::int[])',
        [servicioIds]
      );

      await client.query(
        'DELETE FROM servicio WHERE direccion_id = $1',
        [direccionId]
      );
    }

    const result = await client.query(
      'DELETE FROM direccion WHERE direccion_id = $1 RETURNING *',
      [direccionId]
    );

    if (result.rows.length === 0) {
      await client.query('COMMIT');
      return res.json({ message: 'Direccion eliminada correctamente' });
    }

    await client.query('COMMIT');

    return res.json({ message: 'Direccion eliminada correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error eliminando direccion:', error);
    return res.status(500).json({ message: 'No se pudo eliminar la direccion' });
  } finally {
    client.release();
  }
});

// ========================
// GET USUARIOS
// ========================
app.get('/usuarios', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM "usuario"');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

app.put('/usuario/:usuarioId', upload.single('foto'), async (req, res) => {
  const usuarioId = Number(req.params.usuarioId);
  const { nombre_completo, telefono, email } = req.body;
  const nuevaFoto = req.file ? req.file.filename : null;

  if (!usuarioId) {
    return res.status(400).json({ message: 'usuarioId invalido' });
  }

  if (!String(nombre_completo || '').trim() || !String(telefono || '').trim() || !String(email || '').trim()) {
    return res.status(400).json({ message: 'Nombre, telefono y correo son obligatorios' });
  }

  try {
    const actual = await db.query(
      'SELECT url_foto_perfil FROM "usuario" WHERE usuario_id = $1',
      [usuarioId]
    );

    if (actual.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const result = await db.query(
      `
        UPDATE "usuario"
        SET nombre_completo = $1, telefono = $2, email = $3,
            url_foto_perfil = COALESCE($4, url_foto_perfil)
        WHERE usuario_id = $5
        RETURNING usuario_id, nombre_completo, telefono, email, url_foto_perfil
      `,
      [String(nombre_completo).trim(), String(telefono).trim(), String(email).trim(), nuevaFoto, usuarioId]
    );

    if (nuevaFoto && actual.rows[0].url_foto_perfil && actual.rows[0].url_foto_perfil !== nuevaFoto) {
      await removeUploadedFile(actual.rows[0].url_foto_perfil);
    }

    return res.json({ message: 'Perfil actualizado correctamente', usuario: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El correo o teléfono ya está registrado' });
    }
    console.error('Error actualizando usuario:', error);
    return res.status(500).json({ message: 'No se pudo actualizar el perfil' });
  }
});

// ========================
// REGISTRO USUARIO (CON FOTO)
// ========================
app.post('/verificacion/solicitar', async (req, res) => {
  const correo = String(req.body?.correo || req.body?.email || '').trim().toLowerCase();
  const tipo = req.body?.tipo === 'paseador' ? 'paseador' : 'cliente';

  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return res.status(400).json({ message: 'Correo inválido' });
  }

  try {
    await enviarCodigoVerificacion({ correo, tipo });
    return res.json({ mensaje: 'Código enviado' });
  } catch (error) {
    console.error('❌ Error enviando código de verificación:', error.message);
    return res.status(500).json({ message: `No se pudo enviar el código de verificación: ${error.message}` });
  }
});

app.post('/verificacion/confirmar', (req, res) => {
  const correo = String(req.body?.correo || req.body?.email || '').trim().toLowerCase();
  const tipo = req.body?.tipo === 'paseador' ? 'paseador' : 'cliente';
  const codigo = String(req.body?.codigo || '').trim();
  const clave = `verificacion:${tipo}:${correo}`;
  const registro = codigosVerificacion.get(clave);

  if (!registro || Date.now() > registro.expiraEn) {
    codigosVerificacion.delete(clave);
    return res.status(400).json({ message: 'El código expiró o no existe' });
  }

  if (registro.codigo !== codigo) {
    return res.status(400).json({ message: 'El código de verificación es incorrecto' });
  }

  codigosVerificacion.delete(clave);
  return res.json({ verificado: true, mensaje: 'Correo verificado' });
});

app.post('/recuperacion/solicitar', async (req, res) => {
  const correo = String(req.body?.correo || req.body?.email || '').trim().toLowerCase();
  const tipo = req.body?.tipo === 'paseador' ? 'paseador' : 'cliente';
  const tabla = tipo === 'paseador' ? 'paseador' : 'usuario';
  const columna = tipo === 'paseador' ? 'correo' : 'email';

  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return res.status(400).json({ message: 'Ingresa un correo válido' });
  }

  try {
    const existe = await db.query(`SELECT 1 FROM ${tabla} WHERE ${columna} = $1 LIMIT 1`, [correo]);
    if (existe.rows.length === 0) {
      return res.status(404).json({ message: 'No existe una cuenta con ese correo' });
    }

    await enviarCodigoVerificacion({ correo, tipo, proposito: 'recuperacion' });
    return res.json({ mensaje: 'Código de recuperación enviado' });
  } catch (error) {
    console.error('❌ Error enviando código de recuperación:', error.message);
    return res.status(500).json({ message: `No se pudo enviar el código: ${error.message}` });
  }
});

app.post('/recuperacion/verificar', (req, res) => {
  const correo = String(req.body?.correo || req.body?.email || '').trim().toLowerCase();
  const tipo = req.body?.tipo === 'paseador' ? 'paseador' : 'cliente';
  const codigo = String(req.body?.codigo || '').trim();
  const clave = `recuperacion:${tipo}:${correo}`;
  const registro = codigosVerificacion.get(clave);

  if (!registro || Date.now() > registro.expiraEn) {
    codigosVerificacion.delete(clave);
    return res.status(400).json({ message: 'El código expiró o no existe' });
  }
  if (registro.codigo !== codigo) {
    return res.status(400).json({ message: 'El código de verificación es incorrecto' });
  }

  return res.json({ verificado: true, mensaje: 'Código verificado' });
});

app.post('/recuperacion/actualizar-contrasenia', async (req, res) => {
  const correo = String(req.body?.correo || req.body?.email || '').trim().toLowerCase();
  const tipo = req.body?.tipo === 'paseador' ? 'paseador' : 'cliente';
  const codigo = String(req.body?.codigo || '').trim();
  const nuevaContrasenia = String(req.body?.nuevaContrasenia || '').trim();

  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return res.status(400).json({ message: 'Correo inválido' });
  }

  if (!nuevaContrasenia || nuevaContrasenia.length < 8) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
  }

  if (!/[A-Z]/.test(nuevaContrasenia)) {
    return res.status(400).json({ message: 'La contraseña debe contener al menos una mayúscula' });
  }

  if (!/[0-9]/.test(nuevaContrasenia)) {
    return res.status(400).json({ message: 'La contraseña debe contener al menos un número' });
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(nuevaContrasenia)) {
    return res.status(400).json({ message: 'La contraseña debe contener al menos un carácter especial' });
  }

  const clave = `recuperacion:${tipo}:${correo}`;
  const registro = codigosVerificacion.get(clave);

  if (!registro || Date.now() > registro.expiraEn) {
    codigosVerificacion.delete(clave);
    return res.status(400).json({ message: 'El código expiró o no existe' });
  }

  if (registro.codigo !== codigo) {
    return res.status(400).json({ message: 'El código de verificación es incorrecto' });
  }

  try {
    const tabla = tipo === 'paseador' ? 'paseador' : 'usuario';
    const columnaCorreo = tipo === 'paseador' ? 'correo' : 'email';
    const columnaId = tipo === 'paseador' ? 'paseador_id' : 'usuario_id';

    const usuarioResult = await db.query(`SELECT ${columnaId} FROM ${tabla} WHERE ${columnaCorreo} = $1 LIMIT 1`, [correo]);
    if (usuarioResult.rows.length === 0) {
      return res.status(404).json({ message: 'No existe una cuenta con ese correo' });
    }

    const contraseniaHasheada = await bcrypt.hash(nuevaContrasenia, 10);
    const updateQuery = `UPDATE ${tabla} SET contrasena = $1 WHERE ${columnaCorreo} = $2`;
    await db.query(updateQuery, [contraseniaHasheada, correo]);

    codigosVerificacion.delete(clave);
    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('❌ Error actualizando contraseña:', error.message);
    return res.status(500).json({ message: `No se pudo actualizar la contraseña: ${error.message}` });
  }
});

app.post('/registro', upload.single('foto'), async (req, res) => {
  console.log("📨 Petición de registro recibida");
  const {
    nombre,
    telefono,
    email,
    password,
    codigo_postal,
    pais,
    estado,
    ciudad,
    colonia,
    calle,
    numero_calle,
    latitud,
    longitud,
  } = req.body;
  const foto = req.file ? req.file.filename : null;

  console.log("📥 Datos recibidos:", {
    nombre,
    telefono,
    email,
    password: password ? "****" : null,
    codigo_postal,
    pais,
    estado,
    ciudad,
    colonia,
    calle,
    numero_calle,
  });
  console.log("📷 Foto:", foto ? `uploads/${foto}` : "Sin foto");

  const requiredFields = {
    nombre,
    telefono,
    email,
    password,
    codigo_postal,
    pais,
    estado,
    ciudad,
    colonia,
    calle,
    numero_calle,
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([, value]) => !String(value || "").trim())
    .map(([key]) => key);

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: "Faltan datos",
      missingFields,
    });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO "usuario" 
      (nombre_completo, telefono, email, contrasena, url_foto_perfil)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING usuario_id
    `;

    const result = await client.query(sql, [
      nombre,
      telefono,
      email,
      hashedPassword,
      foto
    ]);

    const usuarioId = result.rows[0].usuario_id;

    await client.query(
      `
        INSERT INTO direccion (
          usuario_id,
          codigo_postal,
          pais,
          estado,
          ciudad,
          colonia,
          calle,
          numero_calle,
          latitud,
          longitud
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        usuarioId,
        codigo_postal,
        pais,
        estado,
        ciudad,
        colonia,
        calle,
        numero_calle,
        Number(latitud) || 0,
        Number(longitud) || 0,
      ]
    );

    await client.query('COMMIT');

    res.json({
      mensaje: "Usuario creado",
      id: usuarioId
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Error en registro:", err);

    if (err.code === '23505') {
      const constraint = err.constraint || '';

      if (constraint.includes('email')) {
        return res.status(400).json({ message: "El correo ya está registrado" });
      }

      if (constraint.includes('telefono')) {
        return res.status(400).json({ message: "El teléfono ya está registrado" });
      }

      return res.status(400).json({ message: "Ya existe un registro con esos datos" });
    }

    res.status(500).json({ message: "Error en servidor" });
  } finally {
    client.release();
  }
});


// ========================
// LOGIN USUARIO
// ========================
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log("📥 Login recibido:", req.body);

  try {
    const result = await db.query(
      'SELECT * FROM "usuario" WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    const usuario = result.rows[0];

    const passwordValido = await bcrypt.compare(password, usuario.contrasena);

    if (!passwordValido) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    res.json({
      message: "Login exitoso",
      usuario
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en servidor" });
  }
});

// ========================
// FUNCIÓN GENERAR ID MASCOTA
// ========================
function generarIdMascota(nombreDueno, nombreMascota, fecha) {
  const inicialesDueno = nombreDueno
    .split(" ")
    .map(p => p[0])
    .join("")
    .toUpperCase();

  const inicialesMascota = nombreMascota
    .split(" ")
    .map(p => p[0])
    .join("")
    .toUpperCase();

  const fechaFormateada = fecha.replaceAll("-", "");
  const random = Math.floor(1000 + Math.random() * 9000);

  return `${inicialesDueno}_${inicialesMascota}_${fechaFormateada}_${random}`;
}

function toBooleanValue(value) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'si' || normalized === 'sí' || normalized === 'true' || normalized === '1';
}


// ========================
// REGISTRO MASCOTA
// ========================



app.post('/mascota', upload.single('foto'), async (req, res) => {
  console.log("🐶 Registro mascota recibido");
  console.log("📥 req.body mascota:", req.body);
  console.log("📷 req.file mascota:", req.file);


  const {
    nombreMascota,
    tipoMascota,
    raza,
    color,
    sexo,
    fechaNacimiento,
    peso,
    esterilizado,
    miedos,
    alergias,
    patas,
    notasExtra,
    usuario_id
  } = req.body;

  const foto = req.file ? req.file.filename : null;

  console.log("URL foto:", foto);
  if (req.file) console.log("Archivo subido en:", req.file.path);

  try {

     const testDB = await db.query("SELECT current_database()");
    console.log("📦 DB actual:", testDB.rows);

    const count = await db.query("SELECT COUNT(*) FROM mascota");
    console.log("🐶 TOTAL MASCOTAS:", count.rows);

    if (!tipoMascota || !nombreMascota || !raza || !color || !sexo || !fechaNacimiento || !peso || !usuario_id) {
      return res.status(400).json({ message: "Datos incompletos mascota" });
    }

    const fechaFormateada = new Date(fechaNacimiento)
      .toISOString()
      .split("T")[0];

    const esEsterilizado = toBooleanValue(esterilizado);

    const sql = `
      INSERT INTO mascota (
        usuario_id,
        tipo_mascota,
        nombre,
        raza,
        color,
        sexo,
        fecha_nacimiento,
        peso_kg,
        esterilizado,
        miedos,
        alergias,
        num_patas,
        notas_comportamiento,
        url_foto
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING mascota_id
    `;

    const result = await db.query(sql, [
      Number(usuario_id),
      tipoMascota,
      nombreMascota,
      raza,
      color,
      sexo,
      fechaFormateada,
      Number(peso),
      esEsterilizado,
      miedos,
      alergias,
      Number(patas),
      notasExtra,
      foto
    ]);

    res.json({
      message: "Mascota registrada",
      mascota_id: result.rows[0].mascota_id
    });

  } catch (error) {
    console.error("❌ Error mascota completo:", error);
   res.status(500).json({
    message: "Error al guardar mascota",
    error: error.message,
    detalle: error.detail,       
    columna: error.column,      
    constraint: error.constraint, 
    tipo: error.code              
    });
  }
});
// ========================
// GET MASCOTAS POR USUARIO
// ========================
app.get('/mascotas/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;

  console.log("📥 Endpoint mascotas llamado");

  try {
    const result = await db.query(
      'SELECT * FROM mascota WHERE usuario_id = $1',
      [usuario_id]
    );

    console.log("🐶 Mascotas encontradas:", result.rows);

    res.json(result.rows);

  } catch (error) {
    console.error("❌ Error obteniendo mascotas:", error);
    res.status(500).json({ message: "Error al obtener mascotas" });
  }
});

// ========================
// ACTUALIZAR MASCOTA
// ========================
app.put('/mascota/:mascota_id', upload.single('foto'), async (req, res) => {
  const mascotaId = Number(req.params.mascota_id);

  if (!mascotaId) {
    if (req.file?.filename) {
      await removeUploadedFile(req.file.filename);
    }
    return res.status(400).json({ message: 'ID de mascota invalido' });
  }

  const {
    tipoMascota,
    nombreMascota,
    nombre,
    raza,
    color,
    sexo,
    fechaNacimiento,
    peso,
    esterilizado,
    miedos,
    alergias,
    patas,
    notasExtra,
  } = req.body;

  const nombreFinal = (nombreMascota || nombre || '').trim();
  const tipoMascotaFinal = String(tipoMascota || '').trim();

  if (!tipoMascotaFinal || !nombreFinal || !raza || !color || !sexo || !fechaNacimiento || !peso) {
    if (req.file?.filename) {
      await removeUploadedFile(req.file.filename);
    }
    return res.status(400).json({ message: 'Datos incompletos para actualizar mascota' });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const mascotaActual = await client.query(
      'SELECT mascota_id, url_foto FROM mascota WHERE mascota_id = $1',
      [mascotaId]
    );

    if (mascotaActual.rows.length === 0) {
      await client.query('ROLLBACK');
      if (req.file?.filename) {
        await removeUploadedFile(req.file.filename);
      }
      return res.status(404).json({ message: 'Mascota no encontrada' });
    }

    const fotoAnterior = mascotaActual.rows[0].url_foto;
    const fotoFinal = req.file ? req.file.filename : fotoAnterior;

    const fechaFormateada = new Date(fechaNacimiento).toISOString().split('T')[0];

    const updateSql = `
      UPDATE mascota
      SET
        tipo_mascota = $1,
        nombre = $2,
        raza = $3,
        color = $4,
        sexo = $5,
        fecha_nacimiento = $6,
        peso_kg = $7,
        esterilizado = $8,
        miedos = $9,
        alergias = $10,
        num_patas = $11,
        notas_comportamiento = $12,
        url_foto = $13
      WHERE mascota_id = $14
      RETURNING *
    `;

    const result = await client.query(updateSql, [
      tipoMascotaFinal,
      nombreFinal,
      raza,
      color,
      sexo,
      fechaFormateada,
      Number(peso),
      toBooleanValue(esterilizado),
      miedos || '',
      alergias || 'No',
      Number(patas) || 4,
      notasExtra || '',
      fotoFinal,
      mascotaId,
    ]);

    await client.query('COMMIT');

    if (req.file && fotoAnterior && fotoAnterior !== fotoFinal) {
      await removeUploadedFile(fotoAnterior);
    }

    return res.json({
      message: 'Mascota actualizada correctamente',
      mascota: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');

    if (req.file?.filename) {
      await removeUploadedFile(req.file.filename);
    }

    console.error('❌ Error actualizando mascota:', error);
    return res.status(500).json({ message: 'Error al actualizar mascota' });
  } finally {
    client.release();
  }
});

// ========================
// ELIMINAR MASCOTA
// ========================
app.delete('/mascota/:mascota_id', async (req, res) => {
  const { mascota_id } = req.params;
  const mascotaId = Number(mascota_id);

  console.log("🗑️ Eliminando mascota ID:", mascota_id);

  if (!mascotaId) {
    return res.status(400).json({ message: "ID de mascota invalido" });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const existeMascota = await client.query(
      'SELECT mascota_id, url_foto FROM mascota WHERE mascota_id = $1',
      [mascotaId]
    );

    if (existeMascota.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Mascota no encontrada" });
    }

    await client.query(
      'UPDATE servicio SET mascota_id = NULL WHERE mascota_id = $1',
      [mascotaId]
    );

    await client.query(
      'DELETE FROM servicio_multiple_mascotas WHERE mascota_id = $1',
      [mascotaId]
    );

    const result = await client.query(
      'DELETE FROM mascota WHERE mascota_id = $1 RETURNING *',
      [mascotaId]
    );

    await client.query('COMMIT');

    await removeUploadedFile(result.rows[0]?.url_foto);

    console.log("🐶 Mascota eliminada:", result.rows[0]);
    res.json({ message: "Mascota eliminada exitosamente" });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error eliminando mascota:", error);
    if (error.code === '23503') {
      return res.status(409).json({
        message: 'No se puede eliminar la mascota porque tiene registros relacionados',
      });
    }
    res.status(500).json({ message: "Error al eliminar mascota" });
  } finally {
    client.release();
  }
});

// ========================
// GET PASEADORES
// ========================
app.get('/paseadores', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM paseador ORDER BY paseador_id'
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Error al obtener paseadores'
    });
  }
});

// ========================
// GET PASEADOR POR ID
// ========================
app.get('/paseador/:id', async (req, res) => {
  try {

    const result = await db.query(
      `SELECT
        p.*,
        COALESCE(r.calificacion_promedio, 0) AS calificacion_promedio,
        COALESCE(r.total_resenas, 0) AS total_resenas
       FROM paseador p
       LEFT JOIN (
         SELECT calificado_usuario_id,
                AVG(promedio_servicio) AS calificacion_promedio,
                COUNT(*) AS total_resenas
         FROM (
           SELECT servicio_id, calificado_usuario_id, AVG(valor_calificacion) AS promedio_servicio
           FROM calificacion
           GROUP BY servicio_id, calificado_usuario_id
         ) resenas_por_servicio
         GROUP BY calificado_usuario_id
       ) r ON r.calificado_usuario_id = p.paseador_id
       WHERE p.paseador_id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Paseador no encontrado'
      });
    }

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Error en servidor'
    });
  }
});

// ─── GET /paseador/:id/calificaciones ─ Reseñas agrupadas por servicio
app.get('/paseador/:id/calificaciones', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        c.servicio_id,
        c.califica_usuario_id,
        MAX(u.nombre_completo) AS cliente_nombre,
        ROUND(AVG(c.valor_calificacion)::numeric, 1) AS promedio,
        MAX(c.comentario) AS comentario,
        MAX(c.fecha_calificacion) AS fecha_calificacion,
        COALESCE(
          json_object_agg(c.categoria, c.valor_calificacion)
            FILTER (WHERE c.categoria IS NOT NULL),
          '{}'::json
        ) AS categorias
       FROM calificacion c
       LEFT JOIN usuario u ON u.usuario_id = c.califica_usuario_id
       WHERE c.calificado_usuario_id = $1
       GROUP BY c.servicio_id, c.califica_usuario_id
       ORDER BY MAX(c.fecha_calificacion) DESC NULLS LAST`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo calificaciones del paseador:', error);
    res.status(500).json({ message: 'No se pudieron obtener las calificaciones' });
  }
});

// ========================
// REGISTRO PASEADOR
// ========================
app.post('/registro-paseador', upload.single('foto'), async (req, res) => {
  const {
    nombre,
    apellido,
    telefono,
    correo,
    contrasenia,
    biografia,
    zona_operacion,
    tarifa_base_hora
  } = req.body;

  const foto = req.file ? req.file.filename : null;

  console.log('📨 Registro paseador:', { nombre, apellido, correo, telefono, tarifa_base_hora, zona_operacion, foto: foto ? `uploads/${foto}` : null });

  if (
    !nombre ||
    !apellido ||
    !telefono ||
    !correo ||
    !contrasenia ||
    !tarifa_base_hora
  ) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  try {
    const existe = await db.query('SELECT correo FROM paseador WHERE correo = $1', [correo]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(contrasenia, 10);

    // validar y castear tarifa a número (acepta coma como separador)
    const tarifaNum = parseFloat(String(tarifa_base_hora).replace(',', '.'));
    if (isNaN(tarifaNum) || tarifaNum <= 0) {
      return res.status(400).json({ message: 'Tarifa inválida' });
    }

    const insertSql = `
      INSERT INTO paseador (
        nombre,
        apellido,
        telefono,
        correo,
        contrasenia,
        biografia,
        url_foto_perfil,
        tarifa_base_hora,
        zona_operacion
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING paseador_id
    `;

    const result = await db.query(insertSql, [
      nombre,
      apellido,
      telefono,
      correo,
      hashedPassword,
      biografia || '',
      foto,
      tarifaNum,
      zona_operacion || ''
    ]);

    const nuevoId = result.rows[0] && result.rows[0].paseador_id;
    if (!nuevoId) {
      console.error('No se obtuvo paseador_id tras INSERT:', result.rows);
      return res.status(500).json({ message: 'No se pudo crear paseador' });
    }

    console.log('✅ Paseador guardado, id:', nuevoId);

    // respuesta en el mismo formato que /registro (usuario)
    res.status(201).json({ mensaje: 'Paseador creado', id: nuevoId });
  } catch (err) {
    console.error('❌ Error en registro paseador:', err);
    if (err.code === '23505') {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }
    res.status(500).json({ message: 'Error en servidor', detail: err.message });
  }
});

// ========================
// LOGIN PASEADOR
// ========================
app.post('/login-paseador', async (req, res) => {

  const { correo, contrasenia } = req.body;

  if (!correo || !contrasenia) {
    return res.status(400).json({
      message: 'Correo y contraseña requeridos'
    });
  }

  try {

    const result = await db.query(
      'SELECT * FROM paseador WHERE correo = $1',
      [correo]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: 'Paseador no encontrado'
      });
    }

    const paseador = result.rows[0];

    const passwordValida = await bcrypt.compare(
      contrasenia,
      paseador.contrasenia
    );

    if (!passwordValida) {
      return res.status(400).json({
        message: 'Contraseña incorrecta'
      });
    }

    // quitar campo sensible antes de enviar
    const safePaseador = { ...paseador };
    delete safePaseador.contrasenia;

    console.log('✅ Paseador autenticado:', safePaseador.paseador_id || safePaseador.correo);

    res.json({ message: 'Login exitoso', paseador: safePaseador });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Error en servidor'
    });
  }
});

// ========================
// ACTUALIZAR PASEADOR
// ========================
app.put('/paseador/:id', upload.single('foto'), async (req, res) => {

  const {
    nombre,
    apellido,
    telefono,
    biografia,
    tarifa_base_hora,
    zona_operacion
  } = req.body;

  const foto = req.file ? req.file.filename : null;

  try {
    const current = await db.query(
      'SELECT url_foto_perfil FROM paseador WHERE paseador_id = $1',
      [req.params.id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({
        message: 'Paseador no encontrado'
      });
    }

    const previousFoto = current.rows[0].url_foto_perfil;

    const fields = [
      nombre,
      apellido,
      telefono,
      biografia,
      tarifa_base_hora,
      zona_operacion,
    ];

    let query = `
      UPDATE paseador
      SET
        nombre = $1,
        apellido = $2,
        telefono = $3,
        biografia = $4,
        tarifa_base_hora = $5,
        zona_operacion = $6`;

    if (foto) {
      query += ', url_foto_perfil = $7';
    }

    query += '\n      WHERE paseador_id = $' + (foto ? '8' : '7') + '\n      RETURNING *\n    ';

    if (foto) {
      fields.push(foto, req.params.id);
    } else {
      fields.push(req.params.id);
    }

    const result = await db.query(query, fields);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Paseador no encontrado'
      });
    }

    if (foto && previousFoto && previousFoto !== foto) {
      await removeUploadedFile(previousFoto);
    }

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Error en servidor'
    });
  }
});

// ========================
// ELIMINAR PASEADOR
// ========================
app.delete('/paseador/:id', async (req, res) => {

  try {

    const result = await db.query(
      'DELETE FROM paseador WHERE paseador_id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Paseador no encontrado'
      });
    }

    await removeUploadedFile(result.rows[0]?.url_foto_perfil);

    res.json({
      message: 'Paseador eliminado correctamente'
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Error en servidor'
    });
  }
});

// ========================
// SERVICIOS (PETICIONES DE PASEO)
// ========================

// ─── POST /servicio ─ Crear solicitud de paseo
app.post('/servicio', async (req, res) => {
  const {
    dueno_id,
    direccion_id,
    mascota_id,
    mascota_ids,
    tipo_servicio,
    duracion_minutos,
    notas_dueno,
    lat,
    lng,
    ubicacion_personalizada,
  } = req.body;

  const duenoId = Number(dueno_id);
  const duracionMinutos = Number(duracion_minutos);
  const tipoServicioNormalizado = String(tipo_servicio || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const mascotaIds = Array.isArray(mascota_ids)
    ? mascota_ids.map((id) => Number(id)).filter(Boolean)
    : mascota_id
      ? [Number(mascota_id)].filter(Boolean)
      : [];

  console.log('📝 Solicitud de servicio:', {
    dueno_id,
    mascota_id,
    mascota_ids,
    tipo_servicio,
    duracion_minutos,
  });

  if (!duenoId || mascotaIds.length === 0 || !tipoServicioNormalizado || !duracionMinutos) {
    return res.status(400).json({ message: 'Datos incompletos' });
  }

  try {
    await db.query('BEGIN');

    let direccionId = null;
    const usarUbicacionPersonalizada = ubicacion_personalizada === true;

    const direccionSeleccionadaId = Number(direccion_id);
    if (direccionSeleccionadaId) {
      const direccionSeleccionada = await db.query(
        'SELECT direccion_id FROM direccion WHERE direccion_id = $1 AND usuario_id = $2 LIMIT 1',
        [direccionSeleccionadaId, duenoId]
      );

      if (direccionSeleccionada.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(400).json({ message: 'La direccion seleccionada no pertenece al cliente' });
      }

      direccionId = direccionSeleccionadaId;
    }

    // Fallback legacy: reusar direccion existente si no se envio direccion_id.
    if (!direccionId && !usarUbicacionPersonalizada) {
      const direccionExistente = await db.query(
        'SELECT direccion_id FROM direccion WHERE usuario_id = $1 ORDER BY direccion_id DESC LIMIT 1',
        [duenoId]
      );

      if (direccionExistente.rows.length > 0) {
        direccionId = direccionExistente.rows[0].direccion_id;
      }
    }

    if (!direccionId && usarUbicacionPersonalizada) {
      const latitudPersonalizada = Number(lat);
      const longitudPersonalizada = Number(lng);

      if (Number.isFinite(latitudPersonalizada) && Number.isFinite(longitudPersonalizada)) {
        const direccionExistente = await db.query(
          `SELECT direccion_id
           FROM direccion
           WHERE usuario_id = $1
             AND ABS(latitud::double precision - $2) < 0.0001
             AND ABS(longitud::double precision - $3) < 0.0001
           ORDER BY direccion_id DESC
           LIMIT 1`,
          [duenoId, latitudPersonalizada, longitudPersonalizada]
        );

        if (direccionExistente.rows.length > 0) {
          direccionId = direccionExistente.rows[0].direccion_id;
        }
      }
    }

    if (!direccionId) {
      const direccionNueva = await db.query(
        `
          INSERT INTO direccion (
            usuario_id,
            codigo_postal,
            pais,
            estado,
            ciudad,
            colonia,
            calle,
            numero_calle,
            latitud,
            longitud
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING direccion_id
        `,
        [
          duenoId,
          '00000',
          'Mexico',
          'Pendiente',
          'Pendiente',
          'Sin colonia',
          'Ubicacion pendiente',
          'S/N',
          Number(lat) || 0,
          Number(lng) || 0,
        ]
      );
      direccionId = direccionNueva.rows[0].direccion_id;
    }

    // Inserta un solo servicio y usa la primera mascota como respaldo para compatibilidad.
    const mascotaPrincipalId = mascotaIds[0];

    const servicioResult = await db.query(`
      INSERT INTO servicio (
        dueno_id,
        mascota_id,
        tipo_servicio,
        duracion_minutos,
        notas_dueno,
        estado,
        hora_solicitada,
        paseador_id,
        direccion_id,
        costo_total
      )
      VALUES ($1, $2, $3, $4, $5, 'esperando', NOW(), NULL, $6, 0)
      RETURNING servicio_id
    `, [
      duenoId,
      mascotaPrincipalId,
      tipoServicioNormalizado,
      duracionMinutos,
      notas_dueno || '',
      direccionId,
    ]);

    const servicioId = servicioResult.rows[0].servicio_id;

    console.log('[Servicio] Direccion usada para la solicitud', {
      servicioId,
      direccionSeleccionadaId,
      direccionId,
      ubicacionPersonalizada: usarUbicacionPersonalizada,
      lat,
      lng,
    });

    for (const currentMascotaId of mascotaIds) {
      await db.query(
        `
          INSERT INTO servicio_multiple_mascotas (servicio_id, mascota_id)
          VALUES ($1, $2)
          ON CONFLICT (servicio_id, mascota_id) DO NOTHING
        `,
        [servicioId, currentMascotaId]
      );
    }

    const detalleServicio = await db.query(
      `
        SELECT
          s.servicio_id,
          s.dueno_id,
          s.tipo_servicio,
          s.duracion_minutos,
          s.notas_dueno,
          u.nombre_completo AS dueno_nombre,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'mascota_id', m.mascota_id,
                'mascota_nombre', m.nombre
              )
            ) FILTER (WHERE m.mascota_id IS NOT NULL),
            '[]'::json
          ) AS mascotas
        FROM servicio s
        LEFT JOIN usuario u ON s.dueno_id = u.usuario_id
        LEFT JOIN servicio_multiple_mascotas smm ON smm.servicio_id = s.servicio_id
        LEFT JOIN mascota m ON m.mascota_id = smm.mascota_id
        WHERE s.servicio_id = $1
        GROUP BY s.servicio_id, s.dueno_id, s.tipo_servicio, s.duracion_minutos, s.notas_dueno, u.nombre_completo
      `,
      [servicioId]
    );

    const servicioData = detalleServicio.rows[0] || {};

    await db.query(`
      INSERT INTO seguimientogps (servicio_id, latitud, longitud, timestamp_registro)
      VALUES ($1, $2, $3, NOW())
    `, [servicioId, lat || 0, lng || 0]);

    await db.query('COMMIT');

    console.log(`✅ Servicio creado: ${servicioId}`);

    iniciarBusquedaServicio(servicioId, servicioData.dueno_id || duenoId);

    res.json({
      servicio_id: servicioId,
      servicio_ids: [servicioId],
      mensaje: 'Solicitud creada',
    });
  } catch (e) {
    try {
      await db.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('❌ Error en rollback de servicio:', rollbackError);
    }
    console.error('❌ Error creando servicio:', e);
    res.status(500).json({ message: e.message });
  }
});

// ─── GET /servicio/:id ─ Obtener detalles del servicio
app.get('/servicio/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        s.*,
        u.nombre_completo AS dueno_nombre,
        p.tarifa_base_hora,
        COALESCE(multi.mascota_nombre, m.nombre, '') AS mascota_nombre,
        p.nombre AS paseador_nombre,
        p.apellido AS paseador_apellido,
        p.biografia AS paseador_biografia,
        p.url_foto_perfil AS paseador_url_foto_perfil,
        d.calle AS direccion_calle,
        d.numero_calle AS direccion_numero_calle,
        d.colonia AS direccion_colonia,
        d.ciudad AS direccion_ciudad,
        d.estado AS direccion_estado,
        d.pais AS direccion_pais,
        d.codigo_postal AS direccion_codigo_postal,
        d.latitud AS direccion_latitud,
        d.longitud AS direccion_longitud
      FROM servicio s
      LEFT JOIN usuario u ON s.dueno_id = u.usuario_id
      LEFT JOIN mascota m ON s.mascota_id = m.mascota_id
      LEFT JOIN paseador p ON s.paseador_id = p.paseador_id
      LEFT JOIN direccion d ON s.direccion_id = d.direccion_id
      LEFT JOIN (
        SELECT smm.servicio_id, STRING_AGG(m.nombre, ', ' ORDER BY m.nombre) AS mascota_nombre
        FROM servicio_multiple_mascotas smm
        JOIN mascota m ON m.mascota_id = smm.mascota_id
        GROUP BY smm.servicio_id
      ) multi ON multi.servicio_id = s.servicio_id
      WHERE s.servicio_id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// ─── POST /calificaciones ─ Guardar reseña del cliente al paseador
app.post('/calificaciones', async (req, res) => {
  const {
    servicio_id,
    califica_usuario_id,
    calificado_usuario_id,
    valor_calificacion,
    comentario,
    categorias,
  } = req.body || {};

  const servicioId = Number(servicio_id);
  const clienteId = Number(califica_usuario_id);
  const paseadorId = Number(calificado_usuario_id);
  const general = Number(valor_calificacion);

  if (!servicioId || !clienteId || !paseadorId || !Number.isInteger(general) || general < 1 || general > 5) {
    return res.status(400).json({ message: 'Datos de calificación inválidos' });
  }

  try {
    const servicioResult = await db.query(
      `SELECT servicio_id, dueno_id, paseador_id, estado
       FROM servicio
       WHERE servicio_id = $1`,
      [servicioId]
    );
    const servicio = servicioResult.rows[0];
    if (!servicio || Number(servicio.dueno_id) !== clienteId || Number(servicio.paseador_id) !== paseadorId) {
      return res.status(403).json({ message: 'No puedes calificar este servicio' });
    }

    const filas = Object.entries(categorias && typeof categorias === 'object' ? categorias : { General: general })
      .filter(([categoria, valor]) => categoria && Number.isInteger(Number(valor)) && Number(valor) >= 1 && Number(valor) <= 5)
      .map(([categoria, valor]) => [categoria, Number(valor)]);
    if (!filas.some(([categoria]) => categoria === 'General')) filas.unshift(['General', general]);

    await db.query(
      `DELETE FROM calificacion
       WHERE servicio_id = $1 AND califica_usuario_id = $2 AND calificado_usuario_id = $3`,
      [servicioId, clienteId, paseadorId]
    );

    for (const [categoria, valor] of filas) {
      await db.query(
        `INSERT INTO calificacion
          (servicio_id, califica_usuario_id, calificado_usuario_id, valor_calificacion, comentario, fecha_calificacion, categoria)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
        [servicioId, clienteId, paseadorId, valor, comentario || '', categoria]
      );
    }

    res.status(201).json({ message: 'Calificación guardada', servicio_id: servicioId });
  } catch (error) {
    console.error('Error guardando calificación:', error);
    res.status(500).json({ message: 'No se pudo guardar la calificación' });
  }
});

app.get('/servicio/:id/mascotas', async (req, res) => {
  try {
    const result = await db.query(
      `
        SELECT m.mascota_id, m.nombre, m.alergias, m.miedos, m.notas_comportamiento, m.url_foto
        FROM servicio_multiple_mascotas smm
        JOIN mascota m ON m.mascota_id = smm.mascota_id
        WHERE smm.servicio_id = $1
        ORDER BY m.nombre
      `,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo mascotas del servicio:', error);
    res.status(500).json({ message: 'No se pudieron obtener las mascotas del servicio' });
  }
});

// ─── PUT /servicio/:id/aceptar ─ Paseador acepta la solicitud
app.put('/servicio/:id/aceptar', async (req, res) => {
  const { paseador_id } = req.body;

  console.log(`🤝 Aceptando servicio ${req.params.id} con paseador ${paseador_id}`);

  try {
    const updateResult = await db.query(`
      UPDATE servicio 
      SET paseador_id = $1, estado = 'confirmar_precio'
      WHERE servicio_id = $2 AND estado = 'esperando' AND paseador_id IS NULL
      RETURNING servicio_id, dueno_id
    `, [paseador_id, req.params.id]);

    if (updateResult.rows.length === 0) {
      return res.status(409).json({ message: 'La solicitud ya no está disponible' });
    }

    limpiarBusquedaServicio(req.params.id);
    console.log('[Busqueda servicio] Solicitud retirada por aceptación', {
      servicioId: Number(req.params.id),
      paseadorId: Number(paseador_id),
    });
    io.to('paseadores').emit('servicio:retirado', {
      servicio_id: Number(req.params.id),
    });

    const servicioResult = await db.query(`
      SELECT
        s.servicio_id,
        s.dueno_id,
        s.paseador_id,
        s.estado,
        s.tipo_servicio,
        s.duracion_minutos,
        s.notas_dueno,
        p.tarifa_base_hora,
        u.nombre_completo AS dueno_nombre,
        d.calle AS direccion_calle,
        d.numero_calle AS direccion_numero_calle,
        d.colonia AS direccion_colonia,
        d.ciudad AS direccion_ciudad,
        d.estado AS direccion_estado,
        d.pais AS direccion_pais,
        d.codigo_postal AS direccion_codigo_postal,
        d.latitud AS direccion_latitud,
        d.longitud AS direccion_longitud
      FROM servicio s
      LEFT JOIN usuario u ON s.dueno_id = u.usuario_id
      LEFT JOIN paseador p ON s.paseador_id = p.paseador_id
      LEFT JOIN direccion d ON s.direccion_id = d.direccion_id
      WHERE s.servicio_id = $1
    `, [req.params.id]);

    const servicio = servicioResult.rows[0];
    console.log(`✅ Servicio ${req.params.id} asignado a paseador ${paseador_id}, esperando confirmación de precio`);

    if (servicio && servicio.dueno_id) {
      io.to(`cliente_${servicio.dueno_id}`).emit('cliente:servicio:confirmar_tarifa', {
        servicio_id: servicio.servicio_id,
        dueno_id: servicio.dueno_id,
        paseador_id: servicio.paseador_id,
        tarifa_base_hora: servicio.tarifa_base_hora,
        tipo_servicio: servicio.tipo_servicio,
        duracion_minutos: servicio.duracion_minutos,
        notas_dueno: servicio.notas_dueno,
      });
      io.to(`cliente_${servicio.dueno_id}`).emit('cliente:servicio:aceptado', {
        servicio_id: servicio.servicio_id,
        dueno_id: servicio.dueno_id,
        estado: servicio.estado,
      });
    }

    res.json(servicio);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// ─── PUT /servicio/:id/iniciar ─ Cliente acepta tarifa y arranca el servicio
app.put('/servicio/:id/iniciar', async (req, res) => {
  try {
    const updateResult = await db.query(`
      UPDATE servicio
      SET estado = 'en_camino', hora_inicio = NULL
      WHERE servicio_id = $1 AND estado = 'confirmar_precio'
      RETURNING *
    `, [req.params.id]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado o no está pendiente de confirmación' });
    }

    const servicioResult = await db.query(`
      SELECT
        s.*,
        u.nombre_completo AS dueno_nombre,
        p.nombre AS paseador_nombre,
        d.calle AS direccion_calle,
        d.numero_calle AS direccion_numero_calle,
        d.colonia AS direccion_colonia,
        d.ciudad AS direccion_ciudad,
        d.estado AS direccion_estado,
        d.pais AS direccion_pais,
        d.codigo_postal AS direccion_codigo_postal,
        d.latitud AS direccion_latitud,
        d.longitud AS direccion_longitud
      FROM servicio s
      LEFT JOIN usuario u ON s.dueno_id = u.usuario_id
      LEFT JOIN paseador p ON s.paseador_id = p.paseador_id
      LEFT JOIN mascota m ON s.mascota_id = m.mascota_id
      LEFT JOIN direccion d ON s.direccion_id = d.direccion_id
      WHERE s.servicio_id = $1
    `, [req.params.id]);

    const servicio = servicioResult.rows[0];
    console.log(`🚀 Servicio ${req.params.id} iniciado tras confirmación del cliente`);

    if (servicio) {
      etapasServicio.set(Number(servicio.servicio_id), {
        etapa: 'recogida',
        llegadaInicialNotificada: false,
        recogidaConfirmada: false,
        regresoNotificado: false,
        entregaRecordatorioNotificado: false,
      });
      io.to(`servicio_${servicio.servicio_id}`).emit('servicio:aceptado', servicio);
      io.to(`cliente_${servicio.dueno_id}`).emit('cliente:servicio:aceptado', {
        servicio_id: servicio.servicio_id,
        dueno_id: servicio.dueno_id,
        estado: servicio.estado,
      });
      if (servicio.paseador_id) {
        io.to(`paseador_${servicio.paseador_id}`).emit('paseador:servicio:confirmado', {
          servicio,
          destino: {
            lat: servicio.direccion_latitud,
            lng: servicio.direccion_longitud,
          },
        });
      }
    }

    res.json(servicio);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// ─── PUT /servicio/:id/rechazar-tarifa ─ Cliente rechaza la tarifa del paseador
app.put('/servicio/:id/rechazar-tarifa', async (req, res) => {
  try {
    const servicioResult = await db.query(`
      SELECT servicio_id, dueno_id, paseador_id, latitud, longitud, tipo_servicio, duracion_minutos, notas_dueno
      FROM servicio
      WHERE servicio_id = $1 AND estado = 'confirmar_precio'
    `, [req.params.id]);

    if (servicioResult.rows.length === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado o no está pendiente de confirmación' });
    }

    const servicioActual = servicioResult.rows[0];
    const revertResult = await db.query(`
      UPDATE servicio
      SET estado = 'esperando', paseador_id = NULL
      WHERE servicio_id = $1
      RETURNING servicio_id, dueno_id, tipo_servicio, duracion_minutos, notas_dueno, latitud, longitud
    `, [req.params.id]);

    const servicio = revertResult.rows[0];
    console.log(`↩️ Servicio ${req.params.id} rechazado por cliente; vuelve a estar disponible`);
    iniciarBusquedaServicio(servicio.servicio_id, servicio.dueno_id);

    // Reenviar la solicitud a los paseadores disponibles
    const detalle = await db.query(`
      SELECT
        s.servicio_id,
        s.dueno_id,
        s.tipo_servicio,
        s.duracion_minutos,
        s.notas_dueno,
        u.nombre_completo AS dueno_nombre,
        d.latitud,
        d.longitud,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'mascota_id', m.mascota_id,
              'mascota_nombre', m.nombre
            )
          ) FILTER (WHERE m.mascota_id IS NOT NULL),
          '[]'::json
        ) AS mascotas
      FROM servicio s
      LEFT JOIN usuario u ON s.dueno_id = u.usuario_id
      LEFT JOIN direccion d ON s.direccion_id = d.direccion_id
      LEFT JOIN servicio_multiple_mascotas smm ON smm.servicio_id = s.servicio_id
      LEFT JOIN mascota m ON m.mascota_id = smm.mascota_id
      WHERE s.servicio_id = $1
      GROUP BY s.servicio_id, s.dueno_id, s.tipo_servicio, s.duracion_minutos, s.notas_dueno, u.nombre_completo, d.latitud, d.longitud
    `, [req.params.id]);

    const detalleServicio = detalle.rows[0];
    if (detalleServicio) {
      io.to('paseadores').emit('servicio:nuevo', {
        servicio_id: detalleServicio.servicio_id,
        dueno_id: detalleServicio.dueno_id,
        dueno_nombre: detalleServicio.dueno_nombre,
        mascotas: detalleServicio.mascotas,
        mascota_nombre: (detalleServicio.mascotas || []).map((item) => item.mascota_nombre).join(', '),
        tipo_servicio: detalleServicio.tipo_servicio,
        duracion_minutos: detalleServicio.duracion_minutos,
        notas_dueno: detalleServicio.notas_dueno,
        notas: detalleServicio.notas_dueno,
        lat: detalleServicio.latitud,
        lng: detalleServicio.longitud,
      });
    }

    if (servicioActual.paseador_id) {
      io.to(`paseador_${servicioActual.paseador_id}`).emit('paseador:tarifa:rechazada', {
        servicio_id: servicioActual.servicio_id,
      });
    }

    res.json(servicio);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// ─── PUT /servicio/:id/rechazar ─ Paseador rechaza la solicitud
app.put('/servicio/:id/rechazar', async (req, res) => {
  const paseadorId = Number(req.body?.paseador_id || 0);
  console.log('[Cancelar/rechazar solicitud] Petición recibida:', {
    servicioId: req.params.id,
    paseadorId,
  });

  try {
    const result = await db.query(`
      UPDATE servicio 
      SET estado = 'esperando', paseador_id = NULL
      WHERE servicio_id = $1 AND estado = 'esperando' AND paseador_id IS NULL
      RETURNING *
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(409).json({ message: 'La solicitud ya no está disponible' });
    }

    const busqueda = busquedasServicio.get(Number(req.params.id));
    if (busqueda && paseadorId) {
      busqueda.intentados.add(paseadorId);
      await enviarSiguientePaseador(req.params.id);
    }

    console.log(`✅ Servicio ${req.params.id} rechazado; continúa la búsqueda`);
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// ─── GET /servicios/pendientes ─ Solicitudes disponibles para paseadores
app.put('/servicio/:id/cancelar', async (req, res) => {
  const paseadorId = Number(req.body?.paseador_id || 0);
  console.log('[Cancelar paseo] Petición recibida:', {
    servicioId: req.params.id,
    paseadorId,
  });

  try {
    const result = await db.query(
      `UPDATE servicio
       SET estado = 'cancelado', hora_fin = NOW()
       WHERE servicio_id = $1 AND paseador_id = $2 AND estado IN ('en_camino', 'activo')
       RETURNING servicio_id, dueno_id, paseador_id`,
      [req.params.id, paseadorId]
    );

    if (result.rows.length === 0) {
      console.warn('[Cancelar paseo] No se actualizó ningún servicio:', {
        servicioId: req.params.id,
        paseadorId,
        motivo: 'El servicio no existe, no pertenece al paseador o no está en_camino/activo',
      });
      return res.status(409).json({ message: 'El paseo ya no está activo o no pertenece al paseador' });
    }

    const servicio = result.rows[0];
    console.log('[Cancelar paseo] Servicio actualizado:', servicio);
    detenerEsperaEntregaInicial(servicio.servicio_id);
    etapasServicio.delete(Number(servicio.servicio_id));
    io.to(`servicio_${servicio.servicio_id}`).emit('servicio:cancelado', {
      servicio_id: Number(servicio.servicio_id),
      cancelado_por: 'paseador',
      mensaje_cliente: 'El paseador canceló el paseo. El monto cobrado fue reembolsado. Gracias por usar nuestra plataforma.',
    });
    io.to(`cliente_${servicio.dueno_id}`).emit('servicio:cancelado', {
      servicio_id: Number(servicio.servicio_id),
      cancelado_por: 'paseador',
      mensaje_cliente: 'El paseador canceló el paseo. El monto cobrado fue reembolsado. Gracias por usar nuestra plataforma.',
    });
    res.json({ servicio_id: servicio.servicio_id, estado: 'cancelado' });
  } catch (error) {
    console.error('Error cancelando paseo:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/servicios/pendientes', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const tieneUbicacion = Number.isFinite(lat) && Number.isFinite(lng);

  try {
    const parametros = tieneUbicacion ? [lat, lng] : [];
    const filtroRadio = tieneUbicacion
      ? `
        AND (
          6371000 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(d.latitud::double precision - $1) / 2), 2) +
            COS(RADIANS($1)) * COS(RADIANS(d.latitud::double precision)) *
            POWER(SIN(RADIANS(d.longitud::double precision - $2) / 2), 2)
          ))
        ) <= ${SEARCH_RADIUS_METERS}
      `
      : '';

    const result = await db.query(`
      SELECT
        s.servicio_id,
        s.dueno_id,
        s.paseador_id,
        s.mascota_id,
        s.direccion_id,
        s.tipo_servicio,
        s.duracion_minutos,
        s.costo_total,
        s.estado,
        s.hora_solicitada,
        s.hora_inicio,
        s.hora_fin,
        s.ruta_geo_json,
        s.notas_dueno,
        s.notas_paseador,
        d.latitud,
        d.longitud,
        u.nombre_completo AS dueno_nombre,
        p.nombre AS paseador_nombre,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'mascota_id', m.mascota_id,
              'mascota_nombre', m.nombre
            )
          ) FILTER (WHERE m.mascota_id IS NOT NULL),
          '[]'::json
        ) AS mascotas,
        COALESCE(
          string_agg(DISTINCT m.nombre, ', ' ORDER BY m.nombre),
          ''
        ) AS mascota_nombre
      FROM servicio s
      LEFT JOIN direccion d ON s.direccion_id = d.direccion_id
      LEFT JOIN usuario u ON s.dueno_id = u.usuario_id
      LEFT JOIN servicio_multiple_mascotas smm ON smm.servicio_id = s.servicio_id
      LEFT JOIN mascota m ON m.mascota_id = smm.mascota_id
      LEFT JOIN paseador p ON s.paseador_id = p.paseador_id
      WHERE s.estado = 'esperando' AND s.paseador_id IS NULL${filtroRadio}
      GROUP BY
        s.servicio_id,
        s.dueno_id,
        s.paseador_id,
        s.mascota_id,
        s.direccion_id,
        s.tipo_servicio,
        s.duracion_minutos,
        s.costo_total,
        s.estado,
        s.hora_solicitada,
        s.hora_inicio,
        s.hora_fin,
        s.ruta_geo_json,
        s.notas_dueno,
        s.notas_paseador,
        d.latitud,
        d.longitud,
        u.nombre_completo,
        p.nombre
      ORDER BY s.hora_solicitada DESC
    `, parametros);

    const solicitudesActivas = result.rows.filter((solicitud) =>
      busquedasServicio.has(Number(solicitud.servicio_id))
    );
    res.json(solicitudesActivas);
  } catch (error) {
    console.error('❌ Error obteniendo servicios pendientes:', error);
    res.status(500).json({ message: 'No se pudieron obtener los servicios pendientes' });
  }
});

// ─── PUT /servicio/:id/cancelar-peticion ─ Cancelar búsqueda de paseador
app.put('/servicio/:id/cancelar-peticion', async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE servicio
       SET estado = 'cancelado', hora_fin = NOW()
       WHERE servicio_id = $1 AND estado = 'esperando' AND paseador_id IS NULL
       RETURNING servicio_id, dueno_id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ message: 'La petición ya no está disponible' });
    }

    const servicio = result.rows[0];
    limpiarBusquedaServicio(servicio.servicio_id);
    io.to('paseadores').emit('servicio:retirado', {
      servicio_id: Number(servicio.servicio_id),
    });
    io.to(`cliente_${servicio.dueno_id}`).emit('cliente:busqueda:sin-paseador', {
      servicio_id: Number(servicio.servicio_id),
    });
    res.json({ servicio_id: servicio.servicio_id, estado: 'cancelado' });
  } catch (error) {
    console.error('Error cancelando petición:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─── PUT /servicio/:id/finalizar ─ Completar servicio
app.put('/servicio/:id/finalizar', async (req, res) => {
  const servicioId = req.params.id;

  try {
    // Obtener todos los puntos GPS de la ruta
    const rutaResult = await db.query(`
      SELECT latitud, longitud, timestamp_registro FROM seguimientogps 
      WHERE servicio_id = $1 
      ORDER BY timestamp_registro
    `, [servicioId]);

    const inicioPaseoAt = obtenerEtapaServicio(servicioId).inicioPaseoAt;
    const puntosDelPaseo = inicioPaseoAt
      ? rutaResult.rows.filter((punto) => new Date(punto.timestamp_registro) >= inicioPaseoAt)
      : rutaResult.rows;
    const distanciaMetros = calcularDistanciaRecorrida(puntosDelPaseo);

    // Crear GeoJSON LineString
    const coordinates = rutaResult.rows.map(r => [parseFloat(r.longitud), parseFloat(r.latitud)]);
    const geoJson = {
      type: 'LineString',
      coordinates
    };

    // Actualizar servicio con ruta y marcar como completado
    const costResult = await db.query(`
      SELECT
        s.servicio_id,
        s.duracion_minutos,
        s.costo_total,
        s.hora_inicio,
        p.tarifa_base_hora,
        COALESCE(multi.mascota_nombre, m.nombre, '') AS mascota_nombre
      FROM servicio s
      LEFT JOIN paseador p ON s.paseador_id = p.paseador_id
      LEFT JOIN mascota m ON s.mascota_id = m.mascota_id
      LEFT JOIN (
        SELECT smm.servicio_id, STRING_AGG(m.nombre, ', ' ORDER BY m.nombre) AS mascota_nombre
        FROM servicio_multiple_mascotas smm
        JOIN mascota m ON m.mascota_id = smm.mascota_id
        GROUP BY smm.servicio_id
      ) multi ON multi.servicio_id = s.servicio_id
      WHERE s.servicio_id = $1
    `, [servicioId]);

    const serviceData = costResult.rows[0] || {};
    const tarifa = Number(serviceData.tarifa_base_hora) || 0;
    const durationMinutes = Number(serviceData.duracion_minutos) || 0;
    const horaInicio = serviceData.hora_inicio ? new Date(serviceData.hora_inicio).getTime() : null;
    let totalCobro = Number(serviceData.costo_total) || 0;
    let computedDuration = durationMinutes;

    if (!computedDuration && horaInicio) {
      const elapsedSeconds = Math.max(0, Math.round((Date.now() - horaInicio) / 1000));
      computedDuration = Math.ceil(elapsedSeconds / 60);
    }

    if (totalCobro <= 0 && tarifa > 0 && computedDuration > 0) {
      totalCobro = Number(((tarifa * computedDuration) / 60).toFixed(2));
    }

    const updateResult = await db.query(`
      UPDATE servicio 
      SET estado = 'completado', hora_fin = NOW(), ruta_geo_json = $1, costo_total = $2, distancia_metros = $3
      WHERE servicio_id = $4
      RETURNING *
    `, [JSON.stringify(geoJson), totalCobro, distanciaMetros, servicioId]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    const servicio = updateResult.rows[0];
    console.log(`✅ Servicio ${servicioId} completado`);

    const detalleResult = await db.query(`
      SELECT
        s.*,
        p.tarifa_base_hora,
        COALESCE(multi.mascota_nombre, m.nombre, '') AS mascota_nombre
      FROM servicio s
      LEFT JOIN paseador p ON s.paseador_id = p.paseador_id
      LEFT JOIN mascota m ON s.mascota_id = m.mascota_id
      LEFT JOIN (
        SELECT smm.servicio_id, STRING_AGG(m.nombre, ', ' ORDER BY m.nombre) AS mascota_nombre
        FROM servicio_multiple_mascotas smm
        JOIN mascota m ON m.mascota_id = smm.mascota_id
        GROUP BY smm.servicio_id
      ) multi ON multi.servicio_id = s.servicio_id
      WHERE s.servicio_id = $1
    `, [servicioId]);

    const servicioDetalle = {
      ...(detalleResult.rows[0] || servicio),
      distancia_metros: distanciaMetros,
      monto_adicional: Number((distanciaMetros * 0.10).toFixed(2)),
    };
    servicioDetalle.monto_total = Number(
      (Number(servicioDetalle.costo_total || 0) + servicioDetalle.monto_adicional).toFixed(2)
    );

    // Notificar al mapa del servicio y a la pantalla principal del cliente.
    io.to(`servicio_${servicioId}`).emit('servicio:finalizado', servicioDetalle);
    if (servicioDetalle.dueno_id) {
      io.to(`cliente_${servicioDetalle.dueno_id}`).emit('servicio:finalizado', servicioDetalle);
    }
    if (servicioDetalle.paseador_id) {
      io.to(`paseador_${servicioDetalle.paseador_id}`).emit('servicio:finalizado', servicioDetalle);
    }
    etapasServicio.delete(Number(servicioId));

    res.json(servicioDetalle);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// ─── GET /servicios/paseador/:id ─ Obtener paseos del paseador
app.get('/ganancias/semanal/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        dias.dia,
        COALESCE(SUM(
            (
              COALESCE(
                NULLIF(p.tarifa_base_hora, 0),
                NULLIF(s.costo_total, 0),
                0
              ) + COALESCE(s.distancia_metros, 0) * 0.10
            ) * 0.80
        ), 0) AS monto
       FROM generate_series(1, 7) AS dias(dia)
       LEFT JOIN servicio s
         ON s.paseador_id = $1
        AND (s.estado IN ('completado', 'finalizado') OR s.penalizacion_entrega = TRUE)
        AND s.hora_fin >= date_trunc('week', CURRENT_DATE)
        AND s.hora_fin < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
        AND EXTRACT(ISODOW FROM s.hora_fin) = dias.dia
        LEFT JOIN paseador p ON p.paseador_id = s.paseador_id
       GROUP BY dias.dia
       ORDER BY dias.dia`,
      [req.params.id]
    );

    res.json(result.rows.map((row) => ({
      dia: Number(row.dia),
      monto: Number(row.monto || 0),
    })));
  } catch (error) {
    console.error('Error obteniendo ganancias semanales:', error);
    res.status(500).json({ message: 'No se pudieron obtener las ganancias semanales' });
  }
});

app.get('/servicios/paseador/:id', async (req, res) => {
  const paseadorId = req.params.id;

  console.log(`📋 Obteniendo servicios del paseador ${paseadorId}`);

  try {
    const result = await db.query(`
      SELECT 
        s.*,
        u.nombre_completo as dueno_nombre,
        m.nombre as mascota_nombre,
        d.calle AS direccion_calle,
        d.numero_calle AS direccion_numero_calle,
        d.colonia AS direccion_colonia,
        d.ciudad AS direccion_ciudad,
        d.estado AS direccion_estado,
        d.pais AS direccion_pais,
        d.codigo_postal AS direccion_codigo_postal,
        d.latitud AS direccion_latitud,
        d.longitud AS direccion_longitud
      FROM servicio s
      LEFT JOIN usuario u ON s.dueno_id = u.usuario_id
      LEFT JOIN mascota m ON s.mascota_id = m.mascota_id
      LEFT JOIN direccion d ON s.direccion_id = d.direccion_id
      WHERE s.paseador_id = $1
      ORDER BY s.hora_solicitada DESC
    `, [paseadorId]);

    console.log(`✅ ${result.rows.length} servicios encontrados`);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// ─── GET /servicios/dueno/:id/paseador-activo ─ Resumen breve del paseador asignado
app.get('/servicios/dueno/:id/paseador-activo', async (req, res) => {
  const duenoId = Number(req.params.id);

  if (!duenoId) {
    return res.status(400).json({ message: 'duenoId invalido' });
  }

  try {
    const result = await db.query(
      `
        SELECT
          s.servicio_id,
          s.estado,
          s.hora_solicitada,
          p.paseador_id,
          p.nombre,
          p.apellido,
          p.biografia,
          p.url_foto_perfil
        FROM servicio s
        LEFT JOIN paseador p ON p.paseador_id = s.paseador_id
        WHERE s.dueno_id = $1
          AND s.paseador_id IS NOT NULL
          AND s.estado IN ('en_camino', 'activo')
        ORDER BY s.hora_solicitada DESC
        LIMIT 1
      `,
      [duenoId]
    );

    if (result.rows.length === 0) {
      return res.json({ paseador: null });
    }

    const row = result.rows[0];

    return res.json({
      paseador: {
        paseador_id: row.paseador_id,
        nombre: row.nombre,
        apellido: row.apellido,
        biografia: row.biografia,
        url_foto_perfil: row.url_foto_perfil,
      },
      servicio: {
        servicio_id: row.servicio_id,
        estado: row.estado,
        hora_solicitada: row.hora_solicitada,
      },
    });
  } catch (error) {
    console.error('Error obteniendo paseador activo del dueno:', error);
    return res.status(500).json({ message: 'No se pudo obtener el paseador activo' });
  }
});

// ─── GET /servicio/:id/ruta ─ Obtener puntos GPS del paseo
app.get('/servicio/:id/ruta', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT latitud, longitud, timestamp_registro 
      FROM seguimientogps 
      WHERE servicio_id = $1 
      ORDER BY timestamp_registro
    `, [req.params.id]);

    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// ========================
// SOCKET.IO EVENTOS
// ========================

io.on('connection', (socket) => {
  console.log(`👤 Usuario conectado: ${socket.id}`);

  socket.on('cliente:online', (data) => {
    const clienteId = Number(data?.clienteId);
    if (!clienteId) return;

    const clienteRoom = `cliente_${clienteId}`;
    console.log(`🟢 Cliente ${clienteId} online`);
    socket.join(clienteRoom);
    for (const [servicioId, etapa] of etapasServicio.entries()) {
      if (!etapa.recogidaConfirmada || etapa.etapa !== 'recogida') continue;
      obtenerContextoServicio(servicioId)
        .then((contexto) => {
          if (contexto && Number(contexto.dueno_id) === clienteId) {
            socket.emit('cliente:entrega:solicitud', {
              servicio_id: Number(servicioId),
              fase: 'recogida',
              segundos_restantes: segundosRestantesEntregaInicial(servicioId),
            });
          }
        })
        .catch((error) => console.error('Error recuperando confirmación de entrega:', error));
    }
    socket.emit('connected', { message: `Conectado a sala ${clienteRoom}` });
  });

  // Paseador se conecta y se une a la sala de paseadores y a su sala individual
  socket.on('paseador:online', (data) => {
    const paseadorId = Number(data?.paseadorId);
    console.log(`🟢 Paseador ${paseadorId} online`);
    socket.join('paseadores');
    if (paseadorId) {
      socket.join(`paseador_${paseadorId}`);
    }
    socket.emit('connected', { message: 'Conectado a sala de paseadores' });
  });

  socket.on('paseador:disponible:ubicacion', (data) => {
    const paseadorId = Number(data?.paseadorId);
    const lat = Number(data?.lat);
    const lng = Number(data?.lng);
    if (!paseadorId || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const anterior = paseadoresEnLinea.get(paseadorId);
    const ahora = Date.now();
    paseadoresEnLinea.set(paseadorId, {
      paseadorId,
      socketId: socket.id,
      lat,
      lng,
      updatedAt: ahora,
      ultimoLog: anterior?.ultimoLog || 0,
    });
    if (ahora - (anterior?.ultimoLog || 0) >= 5000) {
      paseadoresEnLinea.get(paseadorId).ultimoLog = ahora;
      console.log('[Presencia paseador] Ubicacion actualizada', { paseadorId, lat, lng });
    }
    [...busquedasServicio.keys()].forEach((servicioId) => {
      enviarSiguientePaseador(servicioId).catch((error) => console.error('Error reintentando búsqueda:', error));
    });
  });

  socket.on('paseador:offline', (data) => {
    const paseadorId = Number(data?.paseadorId);
    if (paseadorId) paseadoresEnLinea.delete(paseadorId);
  });

  socket.on('paseador:recogida:confirmada', async (data) => {
    const servicioId = Number(data?.servicioId);
    const paseadorId = Number(data?.paseadorId);
    if (!servicioId || !paseadorId) return;

    try {
      const result = await db.query(
        `SELECT servicio_id, dueno_id, paseador_id
         FROM servicio
         WHERE servicio_id = $1 AND paseador_id = $2 AND estado = 'en_camino'`,
        [servicioId, paseadorId]
      );
      const servicio = result.rows[0];
      if (!servicio) return;

      const etapa = obtenerEtapaServicio(servicioId);
      etapa.recogidaConfirmada = true;
      etapa.paseadorRecibimientoConfirmado = true;
      if (!etapa.inicioEsperaEntrega) iniciarEsperaEntregaInicial(servicioId, servicio);

      const paseoActivo = await activarPaseoSiAmbosConfirman(servicioId, servicio);
      if (!paseoActivo && !etapa.clienteRecibimientoConfirmado) {
        io.to(`cliente_${servicio.dueno_id}`).emit('cliente:entrega:solicitud', {
          servicio_id: servicioId,
          fase: 'recogida',
        });
      }
    } catch (error) {
      console.error('Error confirmando llegada del paseador:', error);
    }
  });

  socket.on('cliente:mascotas:entregadas', async (data) => {
    const servicioId = Number(data?.servicioId);
    if (!servicioId) return;

    try {
      const contexto = await obtenerContextoServicio(servicioId);
      if (!contexto) return;

      const etapa = obtenerEtapaServicio(servicioId);
      etapa.clienteRecibimientoConfirmado = true;
      await activarPaseoSiAmbosConfirman(servicioId, contexto);
      io.to(`paseador_${contexto.paseador_id}`).emit('paseador:recibimiento:confirmado', { servicio_id: servicioId });
    } catch (error) {
      console.error('Error confirmando entrega inicial:', error);
    }
  });

  socket.on('cliente:mascotas:no-entregadas:expirar', async (data) => {
    const servicioId = Number(data?.servicioId);
    if (!servicioId) return;

    try {
      detenerEsperaEntregaInicial(servicioId);
      const contexto = await obtenerContextoServicio(servicioId);
      if (!contexto) return;

      await db.query(
        `UPDATE servicio
         SET estado = 'cancelado', hora_fin = NOW(),
             costo_total = COALESCE(NULLIF(costo_total, 0), (
               SELECT tarifa_base_hora FROM paseador WHERE paseador_id = servicio.paseador_id
             )),
             penalizacion_entrega = TRUE
         WHERE servicio_id = $1 AND estado = 'en_camino'`,
        [servicioId]
      );
      etapasServicio.delete(servicioId);
      const payload = {
        servicio_id: servicioId,
        penalizacion_entrega: true,
        mensaje_cliente: 'Por retraso de entrega, se te hizo el cobro correspondiente.',
        mensaje_paseador: 'El viaje fue cancelado porque el cliente no entregó las mascotas. Conservas la tarifa base menos el 20%.',
      };
      io.to(`cliente_${contexto.dueno_id}`).emit('servicio:cancelado', payload);
      io.to(`paseador_${contexto.paseador_id}`).emit('servicio:cancelado', payload);
    } catch (error) {
      console.error('Error cancelando servicio sin entrega de mascotas:', error);
    }
  });

  socket.on('cliente:mascotas:no-entregadas', async (data) => {
    const servicioId = Number(data?.servicioId);
    if (!servicioId) return;

    try {
      const contexto = await obtenerContextoServicio(servicioId);
      if (!contexto) return;
    } catch (error) {
      console.error('Error registrando falta de entrega:', error);
    }
  });

  socket.on('paseador:entrega:solicitar', async (data) => {
    const servicioId = Number(data?.servicioId);
    const paseadorId = Number(data?.paseadorId);
    if (!servicioId || !paseadorId) return;

    try {
      const result = await db.query(
        'SELECT dueno_id, paseador_id FROM servicio WHERE servicio_id = $1',
        [servicioId]
      );
      const servicio = result.rows[0];
      if (!servicio || Number(servicio.paseador_id) !== paseadorId) return;

      io.to(`cliente_${servicio.dueno_id}`).emit('cliente:entrega:solicitud', {
        servicio_id: servicioId,
        fase: 'final',
      });
      io.to(`servicio_${servicioId}`).emit('cliente:entrega:solicitud', {
        servicio_id: servicioId,
        fase: 'final',
      });
    } catch (error) {
      console.error('Error solicitando confirmación de entrega:', error);
    }
  });

  socket.on('cliente:entrega:confirmar', async (data) => {
    const servicioId = Number(data?.servicioId);
    const respuesta = data?.respuesta === true;
    if (!servicioId) return;

    try {
      const result = await db.query(
        'SELECT dueno_id, paseador_id FROM servicio WHERE servicio_id = $1',
        [servicioId]
      );
      const servicio = result.rows[0];
      if (!servicio) return;

      if (!respuesta) {
        const contexto = await obtenerContextoServicio(servicioId);
        if (contexto) iniciarEsperaEntregaFinal(servicioId, contexto);
        io.to(`paseador_${servicio.paseador_id}`).emit('paseador:entrega:rechazada', { servicio_id: servicioId });
        io.to(`cliente_${servicio.dueno_id}`).emit('cliente:entrega:prorroga', {
          servicio_id: servicioId,
          segundos_restantes: ESPERA_ENTREGA_FINAL_MS / 1000,
        });
        return;
      }

      detenerEsperaEntregaFinal(servicioId);
      io.to(`paseador_${servicio.paseador_id}`).emit('paseador:entrega:confirmada', { servicio_id: servicioId });
      io.to(`cliente_${servicio.dueno_id}`).emit('servicio:entrega:confirmada', { servicio_id: servicioId });
    } catch (error) {
      console.error('Error confirmando entrega de mascotas:', error);
    }
  });

  // Cliente observa un servicio en particular
  socket.on('cliente:watch', (data) => {
    const servicioId = Number(data?.servicioId || 0);
    const servicioRoom = `servicio_${servicioId}`;
    console.log(`👁️ Cliente observando servicio ${servicioId}`);
    socket.join(servicioRoom);
    const etapa = obtenerEtapaServicio(servicioId);
    if (servicioId && etapa.recogidaConfirmada && etapa.etapa === 'recogida') {
      socket.emit('cliente:entrega:solicitud', {
        servicio_id: servicioId,
        fase: 'recogida',
        segundos_restantes: segundosRestantesEntregaInicial(servicioId),
      });
    }
  });

  // Paseador envía ubicación en vivo
  socket.on('paseador:location', async (data) => {
    const { servicioId, lat, lng } = data;

    procesarProximidadServicio(servicioId, lat, lng)
      .catch((error) => console.error('Error procesando proximidad del servicio:', error));

    // Guardar en BD
    try {
      await db.query(`
        INSERT INTO seguimientogps (servicio_id, latitud, longitud, timestamp_registro)
        VALUES ($1, $2, $3, NOW())
      `, [servicioId, lat, lng]);
    } catch (e) {
      console.error('Error guardando GPS:', e);
    }

    // Emitir a todos los clientes observando este servicio
    io.to(`servicio_${servicioId}`).emit('paseador:location', { lat, lng });
  });

  // Finalizar servicio por socket
  socket.on('servicio:finalizar', async (data) => {
    const { servicioId } = data;
    console.log(`🏁 Finalizando servicio ${servicioId} por socket`);

    try {
      const rutaResult = await db.query(`
        SELECT latitud, longitud FROM seguimientogps 
        WHERE servicio_id = $1 
        ORDER BY timestamp_registro
      `, [servicioId]);

      const coordinates = rutaResult.rows.map(r => [parseFloat(r.longitud), parseFloat(r.latitud)]);
      const geoJson = {
        type: 'LineString',
        coordinates
      };

      await db.query(`
        UPDATE servicio 
        SET estado = 'completado', hora_fin = NOW(), ruta_geo_json = $1
        WHERE servicio_id = $2
      `, [JSON.stringify(geoJson), servicioId]);

      io.to(`servicio_${servicioId}`).emit('servicio:finalizado', { servicio_id: servicioId });
    } catch (e) {
      console.error(e);
    }
  });

  socket.on('disconnect', () => {
    for (const [paseadorId, paseador] of paseadoresEnLinea.entries()) {
      if (paseador.socketId === socket.id) paseadoresEnLinea.delete(paseadorId);
    }
    console.log(`👋 Usuario desconectado: ${socket.id}`);
  });
});

// ========================
// SERVIDOR
// ========================
server.listen(3000, () => {
  console.log('🚀 Servidor con Socket.IO corriendo en http://localhost:3000');
});
