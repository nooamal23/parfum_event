'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { adminLogin, ApiError } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await adminLogin(email, password);
      // sessionStorage : le token ne survit pas à la fermeture de l'onglet,
      // ce qui limite l'exposition en cas de poste partagé (salle de formation).
      sessionStorage.setItem('admin_token', token);
      router.push('/admin/participants');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-lavender-50 px-6">
      <div className="w-full max-w-sm rounded-xl2 border border-lavender-200 bg-surface p-8 shadow-card">
        <h1 className="font-display text-xl font-semibold text-ink">Espace formateur</h1>
        <p className="mt-1 text-sm text-muted">Connectez-vous pour piloter l&apos;événement.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <p role="alert" className="rounded-lg bg-danger-bg px-4 py-2 text-sm text-danger-dark">{error}</p>}

          <label className="block">
            <span className="mb-1 block text-sm text-ink/80">E-mail</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-lavender-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-ink/80">Mot de passe</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-lavender-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>

          <Button type="submit" loading={loading} className="w-full">
            Se connecter
          </Button>
        </form>
      </div>
    </main>
  );
}
