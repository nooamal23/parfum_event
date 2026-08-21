const { query } = require('../config/db');

async function findByEmail(email) {
  const { rows } = await query('SELECT * FROM admins WHERE email = $1', [email]);
  return rows[0] || null;
}

module.exports = { findByEmail };
