const { Pool } = require('pg');
const logger = require('../utils/logger');

// took me a while to figure out the right pool settings
// too many connections was killing the free tier postgres instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // need SSL for render/neon.tech in production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  logger.info('New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', { error: err.message });
});

// helper to run queries with automatic client release
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    // only log slow queries in dev to avoid noise
    if (duration > 200 && process.env.NODE_ENV !== 'production') {
      logger.warn('Slow query detected', { text: text.substring(0, 80), duration, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    logger.error('Database query error', { text: text.substring(0, 80), error: error.message });
    throw error;
  }
};

// for transactions
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

module.exports = { pool, query, getClient };
