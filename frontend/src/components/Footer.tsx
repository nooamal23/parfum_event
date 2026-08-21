export default function Footer() {
  return (
    <footer className="border-t border-lavender-200 bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted flex flex-col md:flex-row items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} Univers des Parfums. Tous droits réservés.</p>
        <p>
          Vos données sont traitées conformément à notre{' '}
          <a href="/confidentialite" className="text-primary hover:underline">
            politique de confidentialité
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
