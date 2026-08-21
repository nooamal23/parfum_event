import type { Config } from 'tailwindcss';

// Palette dérivée de la maquette "univers du parfum" (style artisanal
// tuniso-marocain) : bleu marine profond pour les actions principales,
// doré pour les accents, fond crème/ivoire, encre bleu-nuit pour le texte.
//
// Les noms de tokens (primary, lavender, ink, muted) sont volontairement
// INCHANGÉS par rapport à l'ancienne palette violette : tout le site les
// référence déjà (Navbar, boutons, formulaires, back-office...), donc changer
// uniquement leurs valeurs hexadécimales ici reskinne l'ensemble du site sans
// toucher à aucun autre fichier.
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B3A6B', // bleu marine profond — boutons, liens, focus
          dark: '#0F2340',    // survol / actif
          light: '#3B5C94',   // variantes plus claires
        },
        // Conservé sous le nom "lavender" pour ne pas casser les classes
        // existantes (bg-lavender-50, border-lavender-200...), mais sert
        // maintenant de palette crème/ivoire.
        lavender: {
          50: '#FAF7EF',
          100: '#F3ECDA',
          200: '#E4D6B0',
        },
        // Nouvel accent doré, utilisé pour les badges numérotés,
        // bordures décoratives ou éléments de mise en valeur.
        gold: {
          DEFAULT: '#C9A227',
          dark: '#9C7A1D',
          light: '#E0C25C',
        },
        ink: '#16233A',
        muted: '#5B6472',
        // Surface neutre (remplace les usages ponctuels de bg-white / text-white)
        surface: '#FFFFFF',
        // États sémantiques centralisés (remplacent red-*, emerald-*, amber-* en dur)
        success: {
          DEFAULT: '#047857',
          dark: '#065F46',
          bg: '#ECFDF5',
        },
        warning: {
          DEFAULT: '#B45309',
          dark: '#92400E',
          bg: '#FFFBEB',
        },
        danger: {
          DEFAULT: '#DC2626',
          dark: '#B91C1C',
          bg: '#FEF2F2',
          border: '#FCA5A5',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        script: ['var(--font-script)', 'cursive'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        card: '0 8px 30px -8px rgba(15, 35, 64, 0.20)',
      },
    },
  },
  plugins: [],
};

export default config;