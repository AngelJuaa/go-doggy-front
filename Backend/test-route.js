const http = require('http');

// Test GET a la raíz (debería 404 normal)
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/registro-paseador',
  method: 'GET',  // GET solo para verificar que existe
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Body:', data.substring(0, 200));
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});

req.end();
