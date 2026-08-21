const { query } = require('../config/db');

// Seule couche autorisée à écrire du SQL concernant les participants.
// Toutes les requêtes sont paramétrées ($1, $2...) : aucune concaténation
// de chaînes avec une valeur utilisateur, par principe, sans exception.

async function findByEmail(email) {
  const { rows } = await query('SELECT * FROM participants WHERE email = $1', [email]);
  return rows[0] || null;
}

async function create(data) {
  const { rows } = await query(
    `INSERT INTO participants
      (nom, prenom, telephone, email, genre, nationalite, ville, gouvernorat, adresse, profession,
       niveau, prix, consentement_rgpd, status, validation_token_hash, token_expires_at, ip_address)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'en_attente_validation',$14,$15,$16)
     RETURNING id, nom, prenom, email, niveau, prix, status, created_at`,
    [
      data.nom,
      data.prenom,
      data.telephone,
      data.email,
      data.genre,
      data.nationalite,
      data.ville,
      data.gouvernorat,
      data.adresse,
      data.profession,
      data.niveau,
      data.prix,
      data.consentementRgpd,
      data.tokenHash,
      data.tokenExpiresAt,
      data.ipAddress ?? null,
    ]
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM participants WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findByTokenHash(tokenHash) {
  const { rows } = await query(
    'SELECT * FROM participants WHERE validation_token_hash = $1',
    [tokenHash]
  );
  return rows[0] || null;
}

// Confirme le participant EN UNE SEULE requête atomique : recherche par hash,
// vérification du statut et de l'expiration, et écriture, tout dans le WHERE
// de l'UPDATE. Impossible que deux requêtes concurrentes (ou un double appel
// accidentel, ex. double-render Next.js en dev) confirment toutes les deux et
// déclenchent deux envois d'e-mail de confirmation : au plus une seule des deux
// requêtes peut correspondre à la ligne (la seconde ne trouve plus rien à
// mettre à jour, car le statut n'est déjà plus 'en_attente_validation').
// Le hash n'est PAS effacé : il reste une trace pour le diagnostic/l'audit,
// sans risque, puisqu'un hash déjà confirmé ne peut plus jamais re-déclencher
// cette requête (la condition status = 'en_attente_validation' l'en empêche).
async function confirmByTokenHash(tokenHash) {
  const { rows } = await query(
    `UPDATE participants
       SET status = 'confirmee',
           confirmed_at = now()
     WHERE validation_token_hash = $1
       AND status = 'en_attente_validation'
       AND token_expires_at > now()
     RETURNING id, nom, prenom, email, status, confirmed_at`,
    [tokenHash]
  );
  return rows[0] || null;
}

// Liste paginée pour le back-office, avec filtre optionnel par statut.
async function listAll({ status, page = 1, pageSize = 20 }) {
  const offset = (page - 1) * pageSize;
  const params = [];
  let whereClause = '';

  if (status) {
    params.push(status);
    whereClause = `WHERE status = $${params.length}`;
  }

  params.push(pageSize, offset);

  const { rows } = await query(
    `SELECT id, nom, prenom, telephone, email, genre, nationalite, ville, gouvernorat,
            profession, niveau, prix, status, created_at, confirmed_at, info_email_sent_at,
            ip_address
       FROM participants
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const countParams = status ? [status] : [];
  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM participants ${whereClause}`,
    countParams
  );

  return { items: rows, total: countRows[0].total, page, pageSize };
}

// Action compensatoire : utilisée quand l'envoi de l'e-mail de validation échoue
// juste après l'insertion, pour éviter qu'une ligne "fantôme" bloque toute
// nouvelle tentative d'inscription avec le même e-mail (contrainte d'unicité).
async function deleteById(id) {
  await query('DELETE FROM participants WHERE id = $1', [id]);
}

// Permet de renvoyer un nouveau lien de validation à un participant déjà
// enregistré mais pas encore confirmé, sans le faire réinscrire de zéro.
async function updateToken(id, { tokenHash, tokenExpiresAt }) {
  const { rows } = await query(
    `UPDATE participants
       SET validation_token_hash = $2, token_expires_at = $3
     WHERE id = $1
     RETURNING id, nom, prenom, email, status`,
    [id, tokenHash, tokenExpiresAt]
  );
  return rows[0] || null;
}

async function markInfoEmailSent(id) {
  const { rows } = await query(
    `UPDATE participants SET info_email_sent_at = now() WHERE id = $1
     RETURNING id, email, info_email_sent_at`,
    [id]
  );
  return rows[0] || null;
}

async function getStats() {
  const { rows } = await query(`
    SELECT
      COUNT(*)::int AS total_inscrits,
      COUNT(*) FILTER (WHERE status = 'confirmee')::int AS total_confirmes,
      COUNT(*) FILTER (WHERE status = 'en_attente_validation')::int AS total_en_attente
    FROM participants
  `);
  return rows[0];
}

module.exports = {
  findByEmail,
  findById,
  create,
  findByTokenHash,
  confirmByTokenHash,
  deleteById,
  updateToken,
  markInfoEmailSent,
  listAll,
  getStats,
};
