const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

// Un seul pool de connexions partagé par toute l'application.
// max: nombre de connexions simultanées adapté à un événement de 2-3h
// avec pics de charge au scan (cf. cahier des charges §3.3).
const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  // Erreur sur une connexion inactive du pool : on log, on ne crash pas le process.
  logger.error('Erreur inattendue sur le pool PostgreSQL', err);
});

async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 200) {
    logger.warn(`Requête lente (${duration}ms): ${text}`);
  }
  return result;
}

async function checkConnection() {
  await pool.query('SELECT 1');
}

module.exports = { pool, query, checkConnection };
