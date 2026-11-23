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
