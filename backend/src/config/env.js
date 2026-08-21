// Point d'entrée unique pour toutes les variables d'environnement.
// Aucun autre fichier du projet ne doit lire process.env directement :
// cela évite les typos silencieuses et centralise les valeurs par défaut.

require('dotenv').config();

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variable d'environnement manquante: ${name}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '4000', 10),

  //frontendUrl: required('FRONTEND_URL', 'http://localhost:3000'),
  frontendUrl: required('FRONTEND_URL', 'http://localhost:3000').replace(/\/+$/, ''),

  databaseUrl: required('DATABASE_URL'),

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  emailTokenTtlMinutes: parseInt(process.env.EMAIL_TOKEN_TTL_MINUTES || '60', 10),

  adminBootstrap: {
    email: process.env.ADMIN_BOOTSTRAP_EMAIL,
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
  },

  // Détails pratiques envoyés dans l'e-mail d'informations (date, lieu, prix...).
  // Configurables via .env pour que l'organisateur puisse les changer sans redéploiement de code.
  event: {
    date: process.env.EVENT_DATE || 'Date à confirmer',
    heure: process.env.EVENT_TIME || '',
    lieu: process.env.EVENT_LOCATION || 'Lieu à confirmer',
    prix: process.env.EVENT_PRICE || '',
    notes: process.env.EVENT_NOTES || '',
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.EMAIL_FROM || 'Univers des Parfums <no-reply@parfumacademy.tn>',
  },
};

module.exports = env;
