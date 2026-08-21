-- ============================================================
-- Migration 001 : schéma initial
-- Module : pré-inscription + double validation par e-mail + admin
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- pour gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;      -- pour un type email insensible à la casse

-- ------------------------------------------------------------
-- Types énumérés
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE participant_status AS ENUM ('en_attente_validation', 'confirmee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE participant_genre AS ENUM ('homme', 'femme');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- Table : participants
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS participants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nom                 VARCHAR(120) NOT NULL,
    prenom              VARCHAR(120) NOT NULL,
    telephone           VARCHAR(30)  NOT NULL,
    email               CITEXT       NOT NULL,           -- comparaison insensible à la casse
    genre               participant_genre NOT NULL,
    nationalite         VARCHAR(100) NOT NULL,
    ville               VARCHAR(120) NOT NULL,
    gouvernorat         VARCHAR(120) NOT NULL,
    adresse             VARCHAR(255),
    profession          VARCHAR(150) NOT NULL,

    status              participant_status NOT NULL DEFAULT 'en_attente_validation',

    -- Le token brut n'est JAMAIS stocké : seul son hash SHA-256 l'est.
    -- Le lien envoyé par e-mail contient le token en clair (usage unique).
    validation_token_hash CHAR(64),
    token_expires_at       TIMESTAMPTZ,

    consentement_rgpd   BOOLEAN NOT NULL DEFAULT false,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at         TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un seul dossier d'inscription par e-mail (cf. cahier des charges §2.2.1)
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_email_unique ON participants (email);

-- Accélère la recherche du token lors du clic sur le lien de confirmation
CREATE INDEX IF NOT EXISTS idx_participants_token_hash ON participants (validation_token_hash);

-- Accélère les filtres du back-office (liste par statut, tri par date)
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants (status);
CREATE INDEX IF NOT EXISTS idx_participants_created_at ON participants (created_at DESC);

-- ------------------------------------------------------------
-- Table : admins (comptes du formateur / présentateur)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom             VARCHAR(120) NOT NULL,
    email           CITEXT NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email_unique ON admins (email);

-- ------------------------------------------------------------
-- Trigger : maintien automatique de updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_participants_updated_at ON participants;
CREATE TRIGGER trg_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
