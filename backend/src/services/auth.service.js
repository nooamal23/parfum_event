const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const adminRepository = require('../repositories/admin.repository');
const { AppError } = require('../middlewares/errorHandler');

async function login(email, password) {
  const admin = await adminRepository.findByEmail(email.trim().toLowerCase());

  // Message volontairement identique que l'email existe ou non :
  // évite de révéler quels comptes existent (énumération d'utilisateurs).
  const invalidCredentialsError = new AppError('Identifiants invalides.', 401);

  if (!admin) throw invalidCredentialsError;

  const passwordMatches = await bcrypt.compare(password, admin.password_hash);
  if (!passwordMatches) throw invalidCredentialsError;

  const token = jwt.sign(
    { sub: admin.id, email: admin.email, nom: admin.nom },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

  return { token, admin: { id: admin.id, email: admin.email, nom: admin.nom } };
}

module.exports = { login };
