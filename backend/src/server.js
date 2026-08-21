const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { checkConnection, pool } = require('./config/db');

async function start() {
  try {
    await checkConnection();
    logger.info('Connexion PostgreSQL établie.');
  } catch (err) {
    logger.error("Impossible de se connecter à la base de données, arrêt du serveur.", err);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    logger.info(`API démarrée sur le port ${env.port} (${env.nodeEnv})`);
  });

  // Arrêt propre : laisse le temps aux requêtes en cours de se terminer
  // et ferme le pool PostgreSQL avant de quitter (important pour Docker/K8s).
  const shutdown = async (signal) => {
    logger.info(`Signal ${signal} reçu, arrêt en cours...`);
    server.close(async () => {
      await pool.end();
      logger.info('Arrêt propre terminé.');
      process.exit(0);
    });
    // Filet de sécurité si close() ne se termine jamais
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
