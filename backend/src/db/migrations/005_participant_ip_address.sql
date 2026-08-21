-- ============================================================
-- Migration 005 : adresse IP d'origine de l'inscription
--
-- Objectif : sécurité / anti-fraude (repérer des inscriptions massives
-- depuis une même IP, aider en cas de litige/abus). Donnée personnelle
-- au sens RGPD : jamais exposée par une route publique, uniquement
-- consultable par le back-office admin (authentifié). À mentionner
-- dans la politique de confidentialité (finalité + base légale :
-- intérêt légitime de sécurité).
-- ============================================================

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS ip_address INET;
