'use strict';

const app = require('./app');
const { testConnection } = require('./db/connection');

const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  try {
    await testConnection();
  } catch (err) {
    console.error('[FATAL] Cannot connect to PostgreSQL:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[Server] Career Intelligence API running on http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

start();
