const authService = require('../services/auth.service');
const participantRepository = require('../repositories/participant.repository');
const emailService = require('../services/email.service');
const { AppError } = require('../middlewares/errorHandler');

// POST /api/admin/login
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError('Email et mot de passe requis.', 400);
  }
  const result = await authService.login(email, password);
  res.json(result);
}

// GET /api/admin/participants?status=confirmee&page=1&pageSize=20
async function listParticipants(req, res) {
  const { status, page, pageSize } = req.query;

  if (status && !['en_attente_validation', 'confirmee'].includes(status)) {
    throw new AppError('Statut de filtre invalide.', 400);
  }

  const result = await participantRepository.listAll({
    status,
    page: page ? parseInt(page, 10) : 1,
    pageSize: pageSize ? Math.min(parseInt(pageSize, 10), 100) : 20,
  });

  res.json(result);
}

// GET /api/admin/stats
async function getStats(req, res) {
  const stats = await participantRepository.getStats();
  res.json(stats);
}

// DELETE /api/admin/participants/:id
async function deleteParticipant(req, res) {
  const { id } = req.params;

  const participant = await participantRepository.findById(id);
  if (!participant) {
    throw new AppError('Participant introuvable.', 404);
  }

  await participantRepository.deleteById(id);
  res.json({ message: 'Participant supprimé.' });
}

// POST /api/admin/participants/:id/envoyer-info
async function sendInfoEmail(req, res) {
  const { id } = req.params;

  const participant = await participantRepository.findById(id);
  if (!participant) {
    throw new AppError('Participant introuvable.', 404);
  }

  if (participant.status !== 'confirmee') {
    // On évite d'envoyer les détails logistiques à quelqu'un qui n'a pas encore
    // confirmé son adresse e-mail : son inscription pourrait ne jamais aboutir.
    throw new AppError(
      "Ce participant n'a pas encore confirmé son inscription par e-mail.",
      409
    );
  }

  await emailService.sendEventInfoEmail({ to: participant.email, prenom: participant.prenom });
  const updated = await participantRepository.markInfoEmailSent(id);

  res.json({ message: 'E-mail d\'informations pratiques envoyé.', participant: updated });
}

module.exports = { login, listParticipants, getStats, deleteParticipant, sendInfoEmail };
