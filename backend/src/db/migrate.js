// Exécute toutes les migrations SQL du dossier migrations/ dans l'ordre alphabétique,
// puis crée le compte admin de bootstrap s'il n'en existe aucun.
// Idempotent : peut être relancé sans risque (CREATE TABLE IF NOT EXISTS, etc.)

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const env = require('../config/env');
const logger = require('../utils/logger');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    logger.info(`Application de la migration: ${file}`);
    await pool.query(sql);
  }
}

async function bootstrapAdmin() {
  const { email, password } = env.adminBootstrap;
  if (!email || !password) {
    logger.warn('ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD non définis, création du compte admin ignorée.');
    return;
  }

  const { rows } = await pool.query('SELECT id FROM admins LIMIT 1');
  if (rows.length > 0) {
    return; // au moins un admin existe déjà, on ne touche à rien
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    'INSERT INTO admins (nom, email, password_hash) VALUES ($1, $2, $3)',
    ['Administrateur', email, passwordHash]
  );
  logger.info(`Compte admin de bootstrap créé pour ${email}`);
}

async function main() {
  try {
    await runMigrations();
    await bootstrapAdmin();
    logger.info('Migrations terminées avec succès.');
    process.exit(0);
  } catch (err) {
    logger.error('Échec des migrations', err);
    process.exit(1);
  }
}

main();
