'use strict';

const { Pool } = require('pg');

let pool;

/**
 * Returns the singleton pg.Pool instance.
 * Reads DATABASE_URL from environment (set by dotenv in app.js).
 */
function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }

    pool = new Pool({
      connectionString,
      max: 10,                // max connections in pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool error:', err.message);
    });
  }

  return pool;
}

/**
 * Executes a parameterised SQL query.
 *
 * @param {string} text   - SQL query string with $1, $2, ... placeholders
 * @param {Array}  params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  const result = await getPool().query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[DB] query (${duration}ms):`, text.slice(0, 80).replace(/\s+/g, ' '));
  }

  return result;
}

/**
 * Obtains a client from the pool for transactions.
 * Caller is responsible for calling client.release().
 *
 * @returns {Promise<import('pg').PoolClient>}
 */
async function getClient() {
  return getPool().connect();
}

/**
 * Tests the database connection.
 * @returns {Promise<void>}
 */
async function testConnection() {
  const result = await query('SELECT NOW() AS now');
  console.log('[DB] Connected. Server time:', result.rows[0].now);
}

module.exports = { query, getClient, testConnection };
