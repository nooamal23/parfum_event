-- ============================================================
-- Migration 002 : traçabilité de l'e-mail d'informations pratiques
-- (date, lieu, prix, détails logistiques) envoyé manuellement par l'admin
-- ============================================================

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS info_email_sent_at TIMESTAMPTZ;
