'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type SVGProps, ReactElement } from 'react';

type NavItem = {
  href: string;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
};

const navItems: NavItem[] = [
  { href: '/admin/participants', label: 'Participants', icon: UsersIcon },
  { href: '/admin/niveaux', label: 'Niveaux de formation', icon: LayersIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  function logout() {
    sessionStorage.removeItem('admin_token');
    router.push('/admin/login');
  }

  return (
    <>
      {/* ---------- Barre supérieure (mobile, < md) ---------- */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-lavender-200 bg-surface px-4 py-3 md:hidden">
        <Link href="/admin/participants" className="flex items-center gap-2 font-display text-base font-semibold text-ink">
          <span aria-hidden className="text-primary">✦</span>
          PARFUMACADEMY
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={mobileOpen}
          className="rounded-lg border border-lavender-200 p-2 text-ink/70 transition hover:bg-lavender-50"
        >
          {mobileOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </header>

      {mobileOpen && (
        <div className="border-b border-lavender-200 bg-surface px-3 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={pathname === item.href}
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </nav>
          <div className="mt-2 border-t border-lavender-100 pt-2">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted transition hover:bg-lavender-50 hover:text-ink"
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Voir le site public
            </Link>
            <button
              type="button"
              onClick={logout}
              className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-danger-bg"
            >
              <LogOutIcon className="h-4 w-4" />
              Se déconnecter
            </button>
          </div>
        </div>
      )}

      {/* ---------- Sidebar fixe (desktop, md+) ---------- */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64 md:flex-col md:border-r md:border-lavender-200 md:bg-surface">
        <div className="flex items-center gap-2.5 border-b border-lavender-200 px-6 py-5">
          <span aria-hidden className="text-lg text-primary">✦</span>
          <div>
            <p className="font-display text-base font-semibold leading-none text-ink">PARFUMACADEMY</p>
            <p className="mt-1 text-xs text-muted">Back-office</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted/80">
            Gestion
          </p>
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </nav>

        <div className="border-t border-lavender-200 p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted transition hover:bg-lavender-50 hover:text-ink"
          >
            <ExternalLinkIcon className="h-4 w-4" />
            Voir le site public
          </Link>
          <button
            type="button"
            onClick={logout}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-danger-bg"
          >
            <LogOutIcon className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </aside>
    </>
  );
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active ? 'bg-primary/10 text-primary' : 'text-ink/70 hover:bg-lavender-50 hover:text-ink'
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-muted'}`} />
      {item.label}
    </Link>
  );
}

// ---------- Icônes (SVG minimalistes inline, style outline — pas de dépendance externe) ----------

function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LayersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  );
}

function LogOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function ExternalLinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  );
}

function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}