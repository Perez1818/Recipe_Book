// database/index.js
const { Pool } = require('pg');

if (!process.env.DATABASE_CONNECTION_STRING) {
  throw new Error('Missing DATABASE_CONNECTION_STRING in .env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_CONNECTION_STRING,
});

// quick ping on startup
pool.query('SELECT 1')
  .then(() => {
    console.log('Postgres pool connected');
  })
  .catch(err => {
    console.error('Postgres connection error:', err.message);
  });

module.exports = { pool };
