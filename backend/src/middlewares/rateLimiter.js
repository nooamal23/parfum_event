const rateLimit = require('express-rate-limit');

// Limite les tentatives d'inscription par IP : évite le spam du formulaire
// et les envois massifs d'e-mails de validation.
const inscriptionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, veuillez réessayer dans quelques minutes.' },
});

// Limite les tentatives de connexion admin : freine le brute-force sur le mot de passe.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.' },
});

module.exports = { inscriptionLimiter, loginLimiter };
