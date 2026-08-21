'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import {
  fetchParticipants,
  fetchStats,
  fetchNiveauxAdmin,
  deleteParticipant,
  sendInfoEmail,
  Participant,
  ApiError,
} from '@/lib/api';
import type { Niveau } from '@/lib/niveaux';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

// Formate un numéro stocké (ex. "+21622321458") en "+216 (TN) 22 321 458".
// Se base sur le numéro lui-même (via libphonenumber-js), pas sur le champ
// "nationalite" (qui est un nom de pays en français, pas un indicatif) :
// un participant peut résider ailleurs que son pays de nationalité.
function formatTelephone(telephone: string): string {
  const phone = parsePhoneNumberFromString(telephone);
  if (!phone || !phone.country) return telephone;
  return `+${phone.countryCallingCode} (${phone.country}) ${phone.formatNational()}`;
}

export default function ParticipantsPage() {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stats, setStats] = useState<{ total_inscrits: number; total_confirmes: number; total_en_attente: number } | null>(null);
  const [niveauxList, setNiveauxList] = useState<Niveau[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // id du participant sur lequel une action (suppression / envoi d'e-mail) est en cours,
  // pour désactiver seulement le bouton concerné plutôt que toute la page.
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [participantsRes, statsRes, niveauxRes] = await Promise.all([
        fetchParticipants(token, statusFilter || undefined),
        fetchStats(token),
        fetchNiveauxAdmin(token),
      ]);
      setParticipants(participantsRes.items);
      setStats(statsRes);
      setNiveauxList(niveauxRes);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        sessionStorage.removeItem('admin_token');
        router.push('/admin/login');
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les participants.');
    } finally {
      setLoading(false);
    }
  }, [router, statusFilter]);

  useEffect(() => {
    // Chargement des données au montage / changement de filtre : setLoading/setError
    // sont les premières lignes de `load` avant le 1er `await`, pattern standard de
    // fetch-on-mount, sans risque de boucle (les dépendances de l'effet ne sont pas
    // modifiées par `load`).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function niveauLabel(niveau: Participant['niveau']): string {
    return niveauxList.find((n) => n.id === niveau)?.label ?? niveau;
  }

  async function handleDelete(participant: Participant) {
    const confirmed = window.confirm(
      `Supprimer définitivement l'inscription de ${participant.prenom} ${participant.nom} (${participant.email}) ?\nCette action est irréversible.`
    );
    if (!confirmed) return;

    const token = sessionStorage.getItem('admin_token');
    if (!token) return;

    setActionLoadingId(participant.id);
    setActionMessage(null);
    try {
      await deleteParticipant(token, participant.id);
      setParticipants((prev) => prev.filter((p) => p.id !== participant.id));
      setActionMessage({ type: 'success', text: `${participant.prenom} ${participant.nom} a été supprimé(e).` });
      // Les compteurs (total / confirmés / en attente) doivent refléter la suppression.
      fetchStats(token).then(setStats).catch(() => { });
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err instanceof ApiError ? err.message : 'Suppression impossible.',
      });
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleSendInfo(participant: Participant) {
    const token = sessionStorage.getItem('admin_token');
    if (!token) return;

    setActionLoadingId(participant.id);
    setActionMessage(null);
    try {
      const { participant: updated } = await sendInfoEmail(token, participant.id);
      setParticipants((prev) => prev.map((p) => (p.id === participant.id ? { ...p, ...updated } : p)));
      setActionMessage({ type: 'success', text: `E-mail d'informations envoyé à ${participant.email}.` });
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err instanceof ApiError ? err.message : "Envoi de l'e-mail impossible.",
      });
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="border-b border-lavender-200 bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <h1 className="font-display text-2xl font-semibold text-ink">Participants</h1>
          <p className="mt-1 text-sm text-muted">Vue d&apos;ensemble des inscriptions à la formation.</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {stats && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total inscrits" value={stats.total_inscrits} />
            <StatCard label="Confirmés" value={stats.total_confirmes} accent="emerald" />
            <StatCard label="En attente" value={stats.total_en_attente} accent="amber" />
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <label className="text-sm text-ink/80">
            Filtrer par statut :{' '}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="ml-2 rounded-lg border border-lavender-200 px-3 py-1.5 text-sm"
            >
              <option value="">Tous</option>
              <option value="confirmee">Confirmés</option>
              <option value="en_attente_validation">En attente</option>
            </select>
          </label>
        </div>

        {error && <p className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger-dark">{error}</p>}
        {actionMessage && (
          <p
            className={`mb-4 rounded-lg px-4 py-3 text-sm ${actionMessage.type === 'success' ? 'bg-success-bg text-success-dark' : 'bg-danger-bg text-danger-dark'
              }`}
          >
            {actionMessage.text}
          </p>
        )}

        <div className="overflow-x-auto rounded-xl2 border border-lavender-200 bg-surface shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-lavender-100 text-ink/70">
              <tr>
                <Th>Nom</Th>
                <Th>E-mail</Th>
                <Th>Téléphone</Th>
                <Th>Nationalité</Th>
                <Th>Profession</Th>
                <Th>Niveau</Th>
                <Th>Prix</Th>
                <Th>Statut</Th>
                <Th>Inscrit le</Th>
                <Th>IP</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-muted">
                    Chargement…
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-muted">
                    Aucun participant pour ce filtre.
                  </td>
                </tr>
              ) : (
                participants.map((p) => (
                  <tr key={p.id} className="border-t border-lavender-100">
                    <td className="px-4 py-3 font-medium text-ink">{p.prenom} {p.nom}</td>
                    <td className="px-4 py-3 text-muted">{p.email}</td>
                    <td className="px-4 py-3 text-muted">{formatTelephone(p.telephone)}</td>
                    <td className="px-4 py-3 text-muted">{p.nationalite}</td>
                    <td className="px-4 py-3 text-muted">{p.profession}</td>
                    <td className="px-4 py-3 text-muted">{niveauLabel(p.niveau)}</td>
                    <td className="px-4 py-3 text-muted">{p.prix} DT</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(p.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {p.ip_address ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleSendInfo(p)}
                          disabled={p.status !== 'confirmee' || actionLoadingId === p.id}
                          title={
                            p.status !== 'confirmee'
                              ? "Le participant doit d'abord confirmer son e-mail"
                              : p.info_email_sent_at
                                ? `Déjà envoyé le ${new Date(p.info_email_sent_at).toLocaleDateString('fr-FR')} — cliquer pour renvoyer`
                                : 'Envoyer les informations pratiques (date, lieu, prix)'
                          }
                          className="rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-lavender-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {actionLoadingId === p.id
                            ? '…'
                            : p.info_email_sent_at
                              ? 'Renvoyer infos'
                              : 'Envoyer infos'}
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={actionLoadingId === p.id}
                          className="rounded-lg border border-danger-border px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {actionLoadingId === p.id ? '…' : 'Supprimer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">{children}</th>;
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: 'emerald' | 'amber' }) {
  const color = accent === 'emerald' ? 'text-success' : accent === 'amber' ? 'text-warning' : 'text-primary';
  return (
    <div className="rounded-xl2 border border-lavender-200 bg-surface p-5 shadow-card">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 font-display text-3xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}