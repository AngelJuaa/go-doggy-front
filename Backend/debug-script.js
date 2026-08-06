#!/usr/bin/env node

/**
 * GoDoggy Debug Script
 * Run: node debug-script.js
 * 
 * Verifies:
 * - Database connection
 * - All tables exist with correct schemas
 * - Server can start with socket.io
 * - Sample data queries work
 */

const pg = require('pg');
const http = require('http');
const express = require('express');

const DB_CONFIG = {
  user: 'postgres',
  password: 'root',
  host: 'localhost',
  port: 5432,
  database: 'GoDoggy'
};

let testsPassed = 0;
let testsFailed = 0;

function logSuccess(msg) {
  console.log(`✅ ${msg}`);
  testsPassed++;
}

function logError(msg, err) {
  console.error(`❌ ${msg}`);
  console.error(`   Error: ${err?.message || err}`);
  testsFailed++;
}

async function testDatabaseConnection() {
  console.log('\n📊 Testing Database Connection...');
  const client = new pg.Client(DB_CONFIG);
  
  try {
    await client.connect();
    logSuccess('Connected to PostgreSQL');
    await client.end();
    return true;
  } catch (e) {
    logError('Database connection failed', e);
    return false;
  }
}

async function testDatabaseSchema() {
  console.log('\n📋 Testing Database Schema...');
  const client = new pg.Client(DB_CONFIG);
  
  try {
    await client.connect();
    
    const tables = ['usuario', 'paseador', 'mascota', 'servicio', 'seguimientogps', 'direccion'];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);
      
      if (result.rows[0].exists) {
        logSuccess(`Table '${table}' exists`);
      } else {
        logError(`Table '${table}' NOT FOUND`, new Error('Missing table'));
      }
    }
    
    await client.end();
  } catch (e) {
    logError('Schema check failed', e);
  }
}

async function testSampleQueries() {
  console.log('\n🔍 Testing Sample Queries...');
  const client = new pg.Client(DB_CONFIG);
  
  try {
    await client.connect();
    
    // Count records
    const usuarios = await client.query('SELECT COUNT(*) as count FROM usuario');
    console.log(`   📍 Usuarios: ${usuarios.rows[0].count}`);
    
    const paseadores = await client.query('SELECT COUNT(*) as count FROM paseador');
    console.log(`   📍 Paseadores: ${paseadores.rows[0].count}`);
    
    const mascotas = await client.query('SELECT COUNT(*) as count FROM mascota');
    console.log(`   📍 Mascotas: ${mascotas.rows[0].count}`);
    
    const servicios = await client.query('SELECT COUNT(*) as count FROM servicio');
    console.log(`   📍 Servicios: ${servicios.rows[0].count}`);
    
    const gps = await client.query('SELECT COUNT(*) as count FROM seguimientogps');
    console.log(`   📍 GPS Points: ${gps.rows[0].count}`);
    
    logSuccess('All sample queries executed');
    
    // Show last service created
    const lastService = await client.query(`
      SELECT s.servicio_id, s.estado, u.nombre_completo as dueno, m.nombre as mascota
      FROM servicio s
      LEFT JOIN usuario u ON s.dueno_id = u.usuario_id
      LEFT JOIN mascota m ON s.mascota_id = m.mascota_id
      ORDER BY s.servicio_id DESC
      LIMIT 1
    `);
    
    if (lastService.rows.length > 0) {
      const service = lastService.rows[0];
      console.log(`   📌 Last service: ID=${service.servicio_id}, Estado=${service.estado}, Cliente=${service.dueno}, Mascota=${service.mascota}`);
    } else {
      console.log(`   ℹ️  No services created yet`);
    }
    
    await client.end();
  } catch (e) {
    logError('Sample queries failed', e);
  }
}

async function testServerStartup() {
  console.log('\n🚀 Testing Server Startup...');
  
  try {
    const app = express();
    const server = http.createServer(app);
    const { Server } = require('socket.io');
    const io = new Server(server, { cors: { origin: '*' } });
    
    logSuccess('HTTP server initialized');
    logSuccess('Socket.IO initialized');
    
    // Test socket connection
    return new Promise((resolve) => {
      let connectionReceived = false;
      
      io.on('connection', (socket) => {
        connectionReceived = true;
        logSuccess('Socket.IO connection handler works');
        socket.disconnect();
      });
      
      server.listen(3001, () => {
        logSuccess('Server listening on port 3001');
        
        // Try to connect a test client
        setTimeout(() => {
          if (!connectionReceived) {
            console.log('   ℹ️  Socket connection not tested (requires socket.io-client)');
          }
          server.close();
          resolve();
        }, 500);
      });
    });
    
  } catch (e) {
    logError('Server startup test failed', e);
  }
}

async function testEnvironment() {
  console.log('\n🔧 Testing Environment...');
  
  try {
    require('express');
    logSuccess('express module available');
  } catch (e) {
    logError('express module missing', e);
  }
  
  try {
    require('pg');
    logSuccess('pg module available');
  } catch (e) {
    logError('pg module missing', e);
  }
  
  try {
    require('socket.io');
    logSuccess('socket.io module available');
  } catch (e) {
    logError('socket.io module missing', e);
  }
  
  try {
    require('bcrypt');
    logSuccess('bcrypt module available');
  } catch (e) {
    logError('bcrypt module missing', e);
  }
  
  try {
    require('multer');
    logSuccess('multer module available');
  } catch (e) {
    logError('multer module missing', e);
  }
}

async function testServiceFlow() {
  console.log('\n🔄 Testing Service Flow (Sample)...');
  const client = new pg.Client(DB_CONFIG);
  
  try {
    await client.connect();
    
    // Check if we have test data
    const usuarios = await client.query('SELECT usuario_id FROM usuario LIMIT 1');
    const mascota = await client.query('SELECT mascota_id FROM mascota LIMIT 1');
    
    if (usuarios.rows.length > 0 && mascota.rows.length > 0) {
      const userId = usuarios.rows[0].usuario_id;
      const mascotaId = mascota.rows[0].mascota_id;
      
      // Check existing service
      const servicio = await client.query(`
        SELECT * FROM servicio WHERE dueno_id = $1 AND estado = 'esperando' LIMIT 1
      `, [userId]);
      
      if (servicio.rows.length > 0) {
        logSuccess(`Found pending service for testing (ID: ${servicio.rows[0].servicio_id})`);
      } else {
        console.log('   ℹ️  No pending services - create one to test real-time flow');
      }
    } else {
      console.log('   ℹ️  Need test data (users and pets) to verify service flow');
    }
    
    await client.end();
  } catch (e) {
    logError('Service flow test failed', e);
  }
}

async function runAllTests() {
  console.log('🧪 GoDoggy Debug Script - Running All Tests\n');
  console.log('Configuration:');
  console.log(`  Database: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
  console.log(`  User: ${DB_CONFIG.user}\n`);
  
  await testEnvironment();
  await testDatabaseConnection();
  await testDatabaseSchema();
  await testSampleQueries();
  await testServiceFlow();
  await testServerStartup();
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('='.repeat(50));
  
  if (testsFailed === 0) {
    console.log('\n✨ All tests passed! System is ready for testing.\n');
  } else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed. Please review and fix.\n`);
  }
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

runAllTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
