const logger = require('../utils/logger');

// Erreur métier volontaire (ex: email déjà utilisé, token expiré) :
// permet aux services de lancer une erreur avec un code HTTP explicite
// sans coupler la couche métier à Express.
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Doit être déclaré en DERNIER dans app.js (après toutes les routes).
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (!err.isOperational) {
    // Erreur non prévue : on log la stack complète pour investigation,
    // mais on ne renvoie jamais de détail interne au client.
    logger.error(`Erreur non gérée sur ${req.method} ${req.path}`, err);
  }

  res.status(statusCode).json({
    error: err.isOperational ? err.message : 'Une erreur interne est survenue.',
  });
}

module.exports = { AppError, errorHandler };
