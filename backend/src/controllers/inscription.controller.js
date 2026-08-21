const participantRepository = require('../repositories/participant.repository');
const tokenService = require('../services/token.service');
const emailService = require('../services/email.service');
const { AppError } = require('../middlewares/errorHandler');
const { normalizeIp } = require('../utils/network');
//const { NIVEAU_PRIX } = require('../validators/inscription.validator');

  const niveauRepository = require('../repositories/niveau.repository');



// POST /api/inscriptions
async function register(req, res) {
  const data = req.validatedBody;

  const existing = await participantRepository.findByEmail(data.email);
  if (existing) {
    // Cf. cahier des charges §2.2.1 : un seul dossier d'inscription par e-mail.
    throw new AppError('Une inscription existe déjà avec cette adresse e-mail.', 409);
  }

  const rawToken = tokenService.generateToken();
  const tokenHash = tokenService.hashToken(rawToken);
  const tokenExpiresAt = tokenService.getExpiryDate();

  // Le prix est déterminé côté serveur à partir du niveau (jamais depuis le
  // corps de la requête) : c'est un "snapshot" du tarif au moment de
  // l'inscription, conservé même si le tarif du niveau change plus tard.

const niveauChoisi = await niveauRepository.findById(data.niveau);
if (!niveauChoisi || !niveauChoisi.actif) {
  throw new AppError('Niveau de formation invalide ou plus disponible.', 400);
}
const prix = niveauChoisi.prix; // toujours recalculé serveur, jamais depuis le client

  const participant = await participantRepository.create({
    ...data,
    prix,
    tokenHash,
    tokenExpiresAt,
    // req.ip respecte "trust proxy" (cf. app.js) : lit X-Forwarded-For derrière
    // Nginx en production, donne l'IP réelle du visiteur et non celle du reverse proxy.
    // normalizeIp() retire le préfixe "::ffff:" ajouté par Node sur les sockets dual-stack.
    ipAddress: normalizeIp(req.ip),
  });

  try {
    await emailService.sendValidationEmail({
      to: participant.email,
      prenom: participant.prenom,
      rawToken,
    });
  } catch (err) {
    // Action compensatoire : si l'envoi échoue (SMTP down, DNS, etc.), on retire
    // la ligne qu'on vient de créer. Sans ça, l'e-mail resterait "pris" en base
    // (contrainte d'unicité) sans qu'aucun lien de validation n'ait jamais été
    // envoyé — le candidat serait bloqué indéfiniment.
    await participantRepository.deleteById(participant.id);
    throw new AppError(
      "L'envoi de l'e-mail de confirmation a échoué. Veuillez réessayer dans quelques instants.",
      502
    );
  }

  res.status(201).json({
    message: 'Inscription enregistrée. Vérifiez votre boîte e-mail pour la confirmer.',
    participant: { id: participant.id, email: participant.email, status: participant.status },
  });
}

// POST /api/inscriptions/renvoyer
// Permet à un candidat qui n'a pas reçu ou a perdu son e-mail de validation
// (lien expiré, boîte spam, etc.) d'en recevoir un nouveau sans se réinscrire.
async function resendValidation(req, res) {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    throw new AppError('Adresse e-mail requise.', 400);
  }

  const participant = await participantRepository.findByEmail(email.trim().toLowerCase());

  // Réponse volontairement identique que le compte existe ou non, et qu'il soit déjà
  // confirmé ou non : évite de révéler quelles adresses sont inscrites (énumération).
  const genericResponse = {
    message: "Si cette adresse est associée à une inscription en attente, un nouvel e-mail de confirmation vient d'être envoyé.",
  };

  if (!participant || participant.status === 'confirmee') {
    return res.json(genericResponse);
  }

  const rawToken = tokenService.generateToken();
  const tokenHash = tokenService.hashToken(rawToken);
  const tokenExpiresAt = tokenService.getExpiryDate();

  await participantRepository.updateToken(participant.id, { tokenHash, tokenExpiresAt });

  await emailService.sendValidationEmail({
    to: participant.email,
    prenom: participant.prenom,
    rawToken,
  });

  res.json(genericResponse);
}

// GET /api/inscriptions/valider/:token
async function validateEmail(req, res) {
  const { token } = req.params;
  const tokenHash = tokenService.hashToken(token);

  // Tentative de confirmation atomique : si une ligne est retournée, c'est
  // CETTE requête qui a confirmé (garanti par la base, même en cas d'appels
  // concurrents ou dupliqués — cf. commentaire sur confirmByTokenHash).
  const confirmed = await participantRepository.confirmByTokenHash(tokenHash);

  if (confirmed) {
    await emailService.sendConfirmationEmail({ to: confirmed.email, prenom: confirmed.prenom });
    return res.json({ message: 'Votre inscription est confirmée avec succès !', participant: confirmed });
  }

  // Rien confirmé par cette requête : on relit en lecture seule pour donner
  // un message précis (le hash n'étant jamais effacé, cette lecture reste fiable).
  const participant = await participantRepository.findByTokenHash(tokenHash);

  if (!participant) {
    throw new AppError('Lien de confirmation invalide ou déjà utilisé.', 400);
  }

  if (participant.status === 'confirmee') {
    // Lien déjà utilisé précédemment (ou par une requête concurrente juste avant) :
    // on répond calmement plutôt que d'échouer bruyamment.
    return res.json({ message: 'Cette inscription a déjà été confirmée.', alreadyConfirmed: true });
  }

  // Statut encore en attente mais l'UPDATE atomique n'a rien trouvé à confirmer :
  // seule possibilité restante, le token a expiré.
  throw new AppError('Ce lien de confirmation a expiré. Veuillez vous réinscrire.', 410);
}

module.exports = { register, validateEmail, resendValidation };
