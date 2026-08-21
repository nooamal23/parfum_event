const { query } = require('../config/db');

async function findAllPublic() {
  const { rows } = await query(
    `SELECT id, label, titre, accroche, description, duree, prerequis, prix, image_url
     FROM niveaux WHERE actif = true ORDER BY ordre ASC, created_at ASC`
  );
  return rows;
}

async function findAllAdmin() {
  const { rows } = await query(`SELECT * FROM niveaux ORDER BY ordre ASC, created_at ASC`);
  return rows;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM niveaux WHERE id = $1', [id]);
  return rows[0] || null;
}

async function create({ id, label, titre, accroche, description, duree, prerequis, prix, ordre, imageUrl }) {
  const { rows } = await query(
    `INSERT INTO niveaux (id, label, titre, accroche, description, duree, prerequis, prix, ordre, image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [id, label, titre, accroche, description, duree, prerequis, prix, ordre, imageUrl || null]
  );
  return rows[0];
}

async function update(id, fields) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findById(id);

  const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
  const { rows } = await query(
    `UPDATE niveaux SET ${setClause} WHERE id = $1 RETURNING *`,
    [id, ...keys.map((k) => fields[k])]
  );
  return rows[0] || null;
}

async function deactivate(id) {
  const { rows } = await query(
    `UPDATE niveaux SET actif = false WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] || null;
}

async function countParticipants(id) {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM participants WHERE niveau = $1', [id]);
  return rows[0].count;
}

module.exports = { findAllPublic, findAllAdmin, findById, create, update, deactivate, countParticipants };