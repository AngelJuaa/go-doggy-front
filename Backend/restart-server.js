#!/usr/bin/env node

// Script para matar todos los node y reiniciar limpio
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

console.log('🔴 Matando todos los procesos Node...');

try {
  if (os.platform() === 'win32') {
    execSync('taskkill /F /IM node.exe 2>nul || exit /b 0');
  } else {
    execSync('pkill -f node 2>/dev/null || true');
  }
  console.log('✅ Procesos Node terminados');
} catch (err) {
  console.log('ℹ️ No había procesos Node activos');
}

console.log('⏳ Esperando 2 segundos...');
setTimeout(() => {
  console.log('\n🚀 Iniciando servidor...\n');
  require('./server.js');
}, 2000);
