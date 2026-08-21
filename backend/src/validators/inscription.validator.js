const { z } = require('zod');
const { isValidPhoneNumber } = require('libphonenumber-js');

// Prix par niveau (source de vérité côté serveur). Le client envoie seulement
// l'identifiant du niveau choisi ; le prix est recalculé ici et jamais lu
// depuis la requête, pour éviter qu'un client falsifie son propre tarif.
const NIVEAU_PRIX = {
  debutant: 150,
  intermediaire: 250,
  avance: 400,
};

// Reflète exactement les champs obligatoires du cahier des charges §2.2.1
const inscriptionSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').max(120),
  prenom: z.string().trim().min(2, 'Le prénom doit contenir au moins 2 caractères').max(120),
  telephone: z
    .string()
    .trim()
    .refine((val) => isValidPhoneNumber(val), {
      message: 'Numéro de téléphone invalide pour le pays sélectionné',
    }),
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide').max(255),
  genre: z.enum(['homme', 'femme'], { errorMap: () => ({ message: 'Genre invalide' }) }),
  nationalite: z.string().trim().min(2).max(100),
  ville: z.string().trim().min(1).max(120),
  gouvernorat: z.string().trim().min(1).max(120),
  adresse: z.string().trim().max(255).optional().default(''),
  profession: z.string().trim().min(1).max(150),
  niveau: z.string().trim().min(1, 'Niveau de formation requis'),
  
  consentementRgpd: z.literal(true, {
    errorMap: () => ({ message: 'Le consentement à la politique de confidentialité est requis' }),
  }),
});

module.exports = { inscriptionSchema, NIVEAU_PRIX };
