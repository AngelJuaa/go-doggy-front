const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  user: 'postgres',
  password: '1111',
  database: 'GoDoggy',
  port: 5432
});

(async () => {
  try {
    await pool.connect();
    console.log('Conectado a la BD. Consultando esquema de `paseador`...');

    const cols = await pool.query(
      `SELECT column_name, data_type, character_maximum_length, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'paseador'
       ORDER BY ordinal_position`
    );

    if (cols.rows.length === 0) {
      console.log('La tabla `paseador` NO existe en la base de datos actual.');
      process.exit(0);
    }

    console.log('Columnas de paseador:');
    cols.rows.forEach(r => console.log('-', r.column_name, r.data_type, r.character_maximum_length || '','nullable:', r.is_nullable));

    try {
      const count = await pool.query('SELECT COUNT(*)::int AS cnt FROM paseador');
      console.log('Filas en paseador:', count.rows[0].cnt);
    } catch (err) {
      console.error('No se pudo contar filas de `paseador`:', err.message || err);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error conectando o consultando:', err.message || err);
    process.exit(1);
  }
})();
