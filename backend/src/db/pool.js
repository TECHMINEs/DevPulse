const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const logger = require('../utils/logger');

let dbInstance = null;
let initPromise = null;

// Initialize the database connection with a singleton promise lock
const initDB = async () => {
  if (dbInstance) return dbInstance;
  
  if (!initPromise) {
    initPromise = (async () => {
      const db = await open({
        filename: path.join(__dirname, '../../../devpulse.sqlite'),
        driver: sqlite3.Database
      });

      logger.info('Connected to SQLite database');
      
      // Enable foreign keys
      await db.run('PRAGMA foreign_keys = ON');
      
      dbInstance = db;
      return db;
    })();
  }
  
  return initPromise;
};

// Map postgres-style $N parameters to SQLite numbered ?N parameters.
// Keeping the number matters: queries may use parameters out of order or more than once
// (e.g. "SET focus = $2 WHERE id = $1"); a bare "?" would bind them positionally and silently
// target the wrong rows.
const mapQuery = (text) => {
  return text.replace(/\$(\d+)/g, '?$1');
};

const query = async (text, params = []) => {
  const start = Date.now();
  const db = await initDB();
  const sqliteText = mapQuery(text);
  
  try {
    // QUAL-06: case-insensitive RETURNING detection
    const upperSql = sqliteText.trim().toUpperCase();
    const isSelect = upperSql.startsWith('SELECT');
    const hasReturning = upperSql.includes('RETURNING');

    if (isSelect || hasReturning) {
      const rows = await db.all(sqliteText, params);
      const duration = Date.now() - start;
      if (duration > 200 && process.env.NODE_ENV !== 'production') {
        logger.warn('Slow query detected', { text: sqliteText.substring(0, 80), duration, rows: rows.length });
      }
      return { rows, rowCount: rows.length };
    } else {
      // For INSERT, UPDATE, DELETE without RETURNING
      const result = await db.run(sqliteText, params);
      const duration = Date.now() - start;
      if (duration > 200 && process.env.NODE_ENV !== 'production') {
        logger.warn('Slow query detected', { text: sqliteText.substring(0, 80), duration, rows: result.changes });
      }
      return { rows: [], rowCount: result.changes, lastID: result.lastID };
    }
  } catch (error) {
    logger.error('Database query error', { text: sqliteText.substring(0, 80), error: error.message });
    throw error;
  }
};

/**
 * CRIT-06: Real SQLite transaction support via getClient().
 * Callers use: BEGIN / COMMIT / ROLLBACK as query text to control the transaction.
 * On failure, call client.query('ROLLBACK') before releasing.
 */
const getClient = async () => {
  const db = await initDB();
  return {
    query: async (text, params = []) => {
      const sqliteText = mapQuery(text);
      const upper = sqliteText.trim().toUpperCase();

      // Intercept transaction control statements
      if (upper === 'BEGIN') {
        await db.run('BEGIN');
        return { rows: [], rowCount: 0 };
      }
      if (upper === 'COMMIT') {
        await db.run('COMMIT');
        return { rows: [], rowCount: 0 };
      }
      if (upper === 'ROLLBACK') {
        await db.run('ROLLBACK');
        return { rows: [], rowCount: 0 };
      }

      // Regular queries — same routing as query()
      const upperSql = sqliteText.trim().toUpperCase();
      if (upperSql.startsWith('SELECT') || upperSql.includes('RETURNING')) {
        const rows = await db.all(sqliteText, params);
        return { rows, rowCount: rows.length };
      } else {
        const result = await db.run(sqliteText, params);
        return { rows: [], rowCount: result.changes, lastID: result.lastID };
      }
    },
    release: () => {}, // no-op for SQLite single connection
  };
};

module.exports = { initDB, query, getClient };
