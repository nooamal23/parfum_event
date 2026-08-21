// Middleware générique : valide req.body contre un schéma zod.
// En cas d'échec, renvoie 400 avec le détail des champs en erreur
// (le frontend s'appuie dessus pour afficher les messages sous chaque champ).
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return res.status(400).json({ error: 'Données invalides', details: errors });
    }
    req.validatedBody = result.data;
    next();
  };
}

module.exports = { validate };
