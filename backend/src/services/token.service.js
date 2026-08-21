const crypto = require('crypto');
const env = require('../config/env');

// Génère un token aléatoire cryptographiquement sûr (256 bits).
// Le token BRUT part dans l'e-mail et n'est jamais persisté.
// Seul son empreinte SHA-256 est stockée en base : si la base fuite,
// les liens de validation ne peuvent pas être reconstruits.
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function getExpiryDate() {
  return new Date(Date.now() + env.emailTokenTtlMinutes * 60 * 1000);
}

function isExpired(expiryDate) {
  return new Date(expiryDate).getTime() < Date.now();
}

module.exports = { generateToken, hashToken, getExpiryDate, isExpired };
