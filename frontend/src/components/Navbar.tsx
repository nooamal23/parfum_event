import Link from 'next/link';

// Les ancres commencent par "/" pour toujours cibler la page d'accueil,
// même quand la Navbar est affichée sur une autre page (ex. /valider-email/[token]).
// Un simple "#formation" resterait relatif à l'URL courante et casserait le lien.
const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/#formation', label: 'Formation' },
  { href: '/#programme', label: 'Programme' },
  { href: '/#temoignages', label: 'Témoignages' },
  { href: '/#contact', label: 'Contact' },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-lavender-200">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <span aria-hidden className="text-primary">✦</span>
          PARFUMACADEMY
        </Link>

        <ul className="hidden gap-8 text-sm text-ink/80 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="transition hover:text-primary">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/inscription"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-surface shadow-card transition hover:bg-primary-dark"
        >
          S&apos;inscrire
        </Link>
      </nav>
    </header>
  );
}
