require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('PostgreSQL error:', {
      message: error.message,
      code: error.code,
      position: error.position
    });

    console.error('Failed SQL:', text);

    if (error.position) {
      const position = Number(error.position) - 1;

      console.error(
        'Error near:',
        text.slice(
          Math.max(0, position - 80),
          position + 80
        )
      );
    }

    throw error;
  }
}

async function testConnection() {
  try {
    const result = await pool.query('SELECT 1');
    return { connected: true, result: result.rows[0] };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  pool,
  query,
  testConnection,
};
