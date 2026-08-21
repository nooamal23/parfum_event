const { z } = require('zod');

const niveauSchema = z.object({
  label: z.string().trim().min(2).max(150),
  titre: z.string().trim().min(2).max(150),
  accroche: z.string().trim().min(2).max(150),
  description: z.string().trim().min(10),
  duree: z.string().trim().min(1).max(100),
  prerequis: z.string().trim().min(1).max(255),
  prix: z.coerce.number().min(0, 'Le prix doit être positif'),
  ordre: z.coerce.number().int().optional().default(0),
});

// Pour la mise à jour, tous les champs sont optionnels (PATCH-like via PUT)
const niveauUpdateSchema = niveauSchema.partial();

module.exports = { niveauSchema, niveauUpdateSchema };