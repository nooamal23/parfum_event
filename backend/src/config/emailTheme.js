// Palette centralisée pour tous les e-mails transactionnels.
//
// Les clients de messagerie (Gmail, Outlook, Apple Mail...) ignorent ou
// suppriment les balises <style> et le CSS externe : les styles inline
// sur chaque élément HTML sont donc une contrainte imposée par l'email,
// pas un choix de code — c'est la pratique standard de l'industrie.
//
// Ce fichier ne centralise que les VALEURS de couleur, pour qu'un seul
// endroit suffise à modifier la charte des e-mails (au lieu de chercher
// des couleurs en dur dans chaque template). Les valeurs reprennent la
// palette de frontend/tailwind.config.ts (primary/gold/ink/muted) pour
// que les e-mails restent visuellement cohérents avec le site.
const emailTheme = {
  primary: '#1B3A6B', // bleu marine profond — titres, boutons
  primaryDark: '#0F2340', // survol / accents plus foncés
  gold: '#C9A227', // accent doré
  ink: '#16233A', // texte principal
  muted: '#5B6472', // texte secondaire (notes, mentions discrètes)
  surface: '#FFFFFF',
  fontFamily: 'Georgia, serif',
};

module.exports = emailTheme;
