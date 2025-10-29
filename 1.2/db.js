// db.js
const { Pool } = require('pg');
const logger = require('./logger');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // optionally set ssl, max, idleTimeoutMillis, etc.
});

pool.on('error', (err) => {
  logger.error('Unexpected PG client error', { message: err.message, stack: err.stack });
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect()
};
