// TEST SCRIPT: solo arranca el servidor sin la conexión a BD
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// revisar que el archivo pueda parsearse
try {
  const server = require('./server.js');
  console.log('✅ server.js se cargó sin errores de sintaxis');
  process.exit(0);
} catch (err) {
  console.error('❌ Error al cargar server.js:', err.message);
  console.error(err.stack);
  process.exit(1);
}
