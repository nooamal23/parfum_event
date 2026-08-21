const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AppError } = require('./errorHandler');

// Protège les routes du back-office : exige un Bearer token JWT valide,
// émis par POST /api/admin/login.
function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Authentification requise.', 401);
  }

  try {
    req.admin = jwt.verify(token, env.jwt.secret);
    next();
  } catch (err) {
    throw new AppError('Session invalide ou expirée, veuillez vous reconnecter.', 401);
  }
}

module.exports = { requireAdminAuth };
