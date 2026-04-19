const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const logger = require('../utils/logger');

let dbInstance = null;

// Initialize the database connection
const initDB = async () => {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: path.join(__dirname, '../../../devpulse.sqlite'),
    driver: sqlite3.Database
  });

  logger.info('Connected to SQLite database');
  
  // Enable foreign keys
  await dbInstance.run('PRAGMA foreign_keys = ON');
  
  return dbInstance;
};

// Map postgres style $1 parameters to sqlite ? parameters
const mapQuery = (text) => {
  return text.replace(/\$(\d+)/g, '?');
};

const query = async (text, params = []) => {
  const start = Date.now();
  const db = await initDB();
  const sqliteText = mapQuery(text);
  
  try {
    // If it's a SELECT or RETURNING query, use db.all()
    if (sqliteText.trim().toUpperCase().startsWith('SELECT') || sqliteText.includes('RETURNING')) {
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

// Add getClient mockup for transactions
const getClient = async () => {
  return {
    query: async (text, params) => query(text, params),
    release: () => {}
  };
};

module.exports = { initDB, query, getClient };
