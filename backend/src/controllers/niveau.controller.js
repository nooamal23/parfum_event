const slugify = require('slugify'); // npm install slugify
const niveauRepository = require('../repositories/niveau.repository');
const { AppError } = require('../middlewares/errorHandler');

// GET /api/niveaux (public)
async function listPublic(req, res) {
  const niveaux = await niveauRepository.findAllPublic();
  res.json(niveaux);
}

// GET /api/admin/niveaux
async function listAdmin(req, res) {
  const niveaux = await niveauRepository.findAllAdmin();
  res.json(niveaux);
}

// POST /api/admin/niveaux
async function create(req, res) {
  const data = req.validatedBody;

  const baseId = slugify(data.label, { lower: true, strict: true });
  let id = baseId;
  let suffix = 1;
  while (await niveauRepository.findById(id)) {
    id = `${baseId}-${suffix++}`;
  }

  const imageUrl = req.file ? `/uploads/niveaux/${req.file.filename}` : null;

  const niveau = await niveauRepository.create({ id, ...data, imageUrl });
  res.status(201).json(niveau);
}

// PUT /api/admin/niveaux/:id
async function update(req, res) {
  const { id } = req.params;
  const existing = await niveauRepository.findById(id);
  if (!existing) throw new AppError('Niveau introuvable.', 404);

  const fields = { ...req.validatedBody };
  if (req.file) {
    fields.image_url = `/uploads/niveaux/${req.file.filename}`;
    // Optionnel : supprimer l'ancienne image du disque ici (fs.unlink) si existing.image_url existait.
  }

  const updated = await niveauRepository.update(id, fields);
  res.json(updated);
}

// DELETE /api/admin/niveaux/:id  (soft-delete)
async function remove(req, res) {
  const { id } = req.params;
  const existing = await niveauRepository.findById(id);
  if (!existing) throw new AppError('Niveau introuvable.', 404);

  const count = await niveauRepository.countParticipants(id);
  if (count > 0) {
    // On désactive plutôt que supprimer : l'historique des inscriptions reste valide.
    const deactivated = await niveauRepository.deactivate(id);
    return res.json({ message: `Niveau désactivé (${count} inscription(s) existante(s)).`, niveau: deactivated });
  }

  await niveauRepository.deactivate(id); // simple, cohérent, réversible plus tard si besoin
  res.json({ message: 'Niveau supprimé.' });
}

module.exports = { listPublic, listAdmin, create, update, remove };