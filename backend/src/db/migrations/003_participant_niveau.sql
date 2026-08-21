-- ============================================================
-- Migration 003 : niveaux de formation (Débutant / Intermédiaire / Avancé)
-- Chaque niveau a un prix propre. Le prix est stocké en base au moment de
-- l'inscription (snapshot) : si le tarif d'un niveau change plus tard, les
-- inscriptions déjà enregistrées gardent le prix payé à l'époque.
-- ============================================================

DO $$ BEGIN
  CREATE TYPE participant_niveau AS ENUM ('debutant', 'intermediaire', 'avance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS niveau participant_niveau NOT NULL DEFAULT 'debutant',
  ADD COLUMN IF NOT EXISTS prix NUMERIC(10, 2) NOT NULL DEFAULT 150;

-- Accélère les filtres/statistiques du back-office par niveau
CREATE INDEX IF NOT EXISTS idx_participants_niveau ON participants (niveau);
