-- ============================================================
-- Migration 004 : table niveaux (gérée par l'admin) + upload image
-- ============================================================

CREATE TABLE IF NOT EXISTS niveaux (
    id            VARCHAR(50) PRIMARY KEY,       -- slug ex. 'debutant' (généré à la création)
    label         VARCHAR(150) NOT NULL,         -- ex. "Niveau Débutant"
    titre         VARCHAR(150) NOT NULL,         -- ex. "Conception de Parfum"
    accroche      VARCHAR(150) NOT NULL,         -- ex. "Premiers pas"
    description   TEXT NOT NULL,
    duree         VARCHAR(100) NOT NULL,
    prerequis     VARCHAR(255) NOT NULL,
    prix          NUMERIC(10, 2) NOT NULL CHECK (prix >= 0),
    image_url     VARCHAR(500),                  -- chemin/URL de l'image (cercle)
    ordre         INTEGER NOT NULL DEFAULT 0,     -- ordre d'affichage dans le carousel
    actif         BOOLEAN NOT NULL DEFAULT true,  -- soft-delete : on ne casse pas l'historique
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_niveaux_updated_at ON niveaux;
CREATE TRIGGER trg_niveaux_updated_at
  BEFORE UPDATE ON niveaux
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed : reprend les 3 niveaux actuellement en dur dans le frontend
INSERT INTO niveaux (id, label, titre, accroche, description, duree, prerequis, prix, ordre) VALUES
  ('debutant', 'Niveau Débutant', 'Conception de Parfum', 'Premiers pas',
   'Découvrez l''art de créer votre propre parfum grâce à une formation pratique et accessible à tous.',
   '1 journée', 'Aucun prérequis', 150, 1),
  ('intermediaire', 'Niveau Intermédiaire', 'Conception de Parfum', 'Aller plus loin',
   'Approfondissez les familles olfactives et composez des accords plus élaborés, avec un accompagnement plus technique.',
   '2 journées', 'Niveau débutant recommandé', 250, 2),
  ('avance', 'Niveau Avancé', 'Conception de Parfum', 'Devenir autonome',
   'Maîtrisez la construction complète d''une pyramide olfactive et créez un parfum sur-mesure du concept à la formulation finale.',
   '3 journées', 'Niveau intermédiaire recommandé', 400, 3)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- participants.niveau : passe de l'ENUM figé à une FK texte vers niveaux(id)
-- ------------------------------------------------------------
ALTER TABLE participants
  ALTER COLUMN niveau DROP DEFAULT,
  ALTER COLUMN niveau TYPE VARCHAR(50) USING niveau::text,
  ALTER COLUMN niveau SET DEFAULT 'debutant';

-- Postgres ne supporte pas "ADD CONSTRAINT IF NOT EXISTS", on vérifie donc
-- manuellement pour que la migration reste rejouable sans erreur.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_participants_niveau'
  ) THEN
    ALTER TABLE participants
      ADD CONSTRAINT fk_participants_niveau
      FOREIGN KEY (niveau) REFERENCES niveaux(id) ON DELETE RESTRICT;
      -- RESTRICT : empêche de supprimer un niveau déjà utilisé par des inscriptions.
      -- L'admin doit désactiver le niveau (actif = false) plutôt que le supprimer.
  END IF;
END $$;

DROP TYPE IF EXISTS participant_niveau;