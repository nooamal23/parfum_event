'use client';

import { FormEvent, useCallback, useEffect, useState, type SVGProps } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import {
    fetchNiveauxAdmin,
    createNiveau,
    updateNiveau,
    deleteNiveau,
    ApiError,
} from '@/lib/api';
import type { Niveau } from '@/lib/niveaux';

function ArrowLeftIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
        </svg>
    );
}

const emptyForm = {
    label: '',
    titre: '',
    accroche: '',
    description: '',
    duree: '',
    prerequis: '',
    prix: '',
    ordre: '1',
};

export default function AdminNiveauxPage() {
    const router = useRouter();
    const [niveaux, setNiveaux] = useState<Niveau[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // Formulaire (création ou édition)
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const load = useCallback(async () => {
        const token = sessionStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await fetchNiveauxAdmin(token);
            setNiveaux(data);
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                sessionStorage.removeItem('admin_token');
                router.push('/admin/login');
                return;
            }
            setError(err instanceof ApiError ? err.message : 'Impossible de charger les niveaux.');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    // Aperçu de l'image sélectionnée : URL objet mémorisée + révoquée au changement
    useEffect(() => {
        if (!imageFile) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(imageFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [imageFile]);

    function resetForm() {
        setEditingId(null);
        setEditingImageUrl(null);
        setForm(emptyForm);
        setImageFile(null);
        setFormError(null);
    }

    function startEdit(niveau: Niveau) {
        setEditingId(niveau.id);
        setEditingImageUrl(niveau.image_url ?? null);
        setForm({
            label: niveau.label,
            titre: niveau.titre,
            accroche: niveau.accroche,
            description: niveau.description,
            duree: niveau.duree,
            prerequis: niveau.prerequis,
            prix: String(niveau.prix),
            ordre: String(niveau.ordre ?? 0),
        });
        setImageFile(null);
        setFormError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const token = sessionStorage.getItem('admin_token');
        if (!token) return;

        // Vérifier si l'ordre est déjà utilisé par un autre niveau
        const ordreValue = Number(form.ordre);
        const conflit = niveaux.find(
            (n) => Number(n.ordre) === ordreValue && n.id !== editingId
        );
        if (conflit) {
            setFormError(`L'ordre ${ordreValue} est déjà utilisé par "${conflit.label}". Choisissez une autre valeur.`);
            return;
        }

        setSubmitting(true);
        setFormError(null);
        try {
            const formData = new FormData();
            formData.append('label', form.label);
            formData.append('titre', form.titre);
            formData.append('accroche', form.accroche);
            formData.append('description', form.description);
            formData.append('duree', form.duree);
            formData.append('prerequis', form.prerequis);
            formData.append('prix', form.prix);
            formData.append('ordre', form.ordre);
            if (imageFile) formData.append('image', imageFile);

            if (editingId) {
                await updateNiveau(token, editingId, formData);
                setActionMessage({ type: 'success', text: `Niveau "${form.label}" mis à jour.` });
            } else {
                await createNiveau(token, formData);
                setActionMessage({ type: 'success', text: `Niveau "${form.label}" créé.` });
            }

            resetForm();
            await load();
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : 'Enregistrement impossible.');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(niveau: Niveau) {
        const confirmed = window.confirm(
            `Supprimer/désactiver le niveau "${niveau.label}" ?\nS'il a déjà des inscrits, il sera seulement désactivé (pas supprimé) pour préserver leur historique.`
        );
        if (!confirmed) return;

        const token = sessionStorage.getItem('admin_token');
        if (!token) return;

        setActionLoadingId(niveau.id);
        setActionMessage(null);
        try {
            await deleteNiveau(token, niveau.id);
            setActionMessage({ type: 'success', text: `Niveau "${niveau.label}" traité.` });
            await load();
        } catch (err) {
            setActionMessage({
                type: 'error',
                text: err instanceof ApiError ? err.message : 'Suppression impossible.',
            });
        } finally {
            setActionLoadingId(null);
        }
    }

    return (
        <main className="min-h-screen">
            <div className="border-b border-lavender-200 bg-surface">
                <div className="mx-auto max-w-6xl px-6 py-6">
                    <Link
                        href="/admin/participants"
                        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-primary"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Participants
                    </Link>
                    <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Niveaux de formation</h1>
                    <p className="mt-1 text-sm text-muted">
                        Créez, modifiez et réorganisez les niveaux proposés sur le site public.
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-6 py-8">
                {actionMessage && (
                    <p
                        className={`mb-4 rounded-lg px-4 py-3 text-sm ${actionMessage.type === 'success' ? 'bg-success-bg text-success-dark' : 'bg-danger-bg text-danger-dark'
                            }`}
                    >
                        {actionMessage.text}
                    </p>
                )}

                {/* ---------- Formulaire création / édition ---------- */}
                <div className="mb-8 rounded-xl2 border border-lavender-200 bg-surface p-6 shadow-card">
                    <h2 className="font-display text-base font-semibold text-ink">
                        {editingId ? `Modifier "${form.label}"` : 'Nouveau niveau'}
                    </h2>

                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                        {formError && <p role="alert" className="rounded-lg bg-danger-bg px-4 py-2 text-sm text-danger-dark">{formError}</p>}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Label (ex. Niveau Débutant)">
                                <input
                                    required
                                    value={form.label}
                                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                                    className="w-full rounded-lg border border-lavender-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </Field>
                            <Field label="Titre (ex. Conception de Parfum)">
                                <input
                                    required
                                    value={form.titre}
                                    onChange={(e) => setForm({ ...form, titre: e.target.value })}
                                    className="w-full rounded-lg border border-lavender-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </Field>
                            <Field label="Accroche (ex. Premiers pas)">
                                <input
                                    required
                                    value={form.accroche}
                                    onChange={(e) => setForm({ ...form, accroche: e.target.value })}
                                    className="w-full rounded-lg border border-lavender-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </Field>
                            <Field label="Durée (ex. 1 journée)">
                                <input
                                    required
                                    value={form.duree}
                                    onChange={(e) => setForm({ ...form, duree: e.target.value })}
                                    className="w-full rounded-lg border border-lavender-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </Field>
                            <Field label="Prérequis">
                                <input
                                    required
                                    value={form.prerequis}
                                    onChange={(e) => setForm({ ...form, prerequis: e.target.value })}
                                    className="w-full rounded-lg border border-lavender-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </Field>
                            <Field label="Prix (DT)">
                                <input
                                    required
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={form.prix}
                                    onChange={(e) => setForm({ ...form, prix: e.target.value })}
                                    className="w-full rounded-lg border border-lavender-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </Field>
                            <Field label="Ordre d'affichage (1 = premier)">
                                <input
                                    required
                                    type="number"
                                    min={1}
                                    step="1"
                                    value={form.ordre}
                                    onChange={(e) => setForm({ ...form, ordre: e.target.value })}
                                    className="w-full rounded-lg border border-lavender-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </Field>
                        </div>

                        <Field label="Description">
                            <textarea
                                required
                                rows={3}
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full rounded-lg border border-lavender-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </Field>

                        <div>
                            <label className="mb-1 block text-sm text-ink/80">Image du niveau (affichée en cercle)</label>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                                className="block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-lavender-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-lavender-200"
                            />

                            {previewUrl ? (
                                <div className="mt-3 h-24 w-24 overflow-hidden rounded-full border border-lavender-200">
                                    <img src={previewUrl} className="h-full w-full object-cover" alt="Aperçu" />
                                </div>
                            ) : editingImageUrl ? (
                                <div className="mt-3 h-24 w-24 overflow-hidden rounded-full border border-lavender-200">
                                    <img
                                        src={
                                            editingImageUrl.startsWith('http')
                                                ? editingImageUrl
                                                : `${process.env.NEXT_PUBLIC_API_URL}${editingImageUrl}`
                                        }
                                        className="h-full w-full object-cover"
                                        alt="Image actuelle"
                                    />
                                </div>
                            ) : null}
                        </div>

                        <div className="flex gap-3">
                            <Button type="submit" loading={submitting}>
                                {editingId ? 'Mettre à jour' : 'Créer le niveau'}
                            </Button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-lg border border-lavender-200 px-5 py-2.5 text-sm font-medium text-ink/70 hover:bg-lavender-50"
                                >
                                    Annuler
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* ---------- Liste des niveaux existants ---------- */}
                {error && <p className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger-dark">{error}</p>}

                <div className="overflow-x-auto rounded-xl2 border border-lavender-200 bg-surface shadow-card">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-lavender-100 text-ink/70">
                            <tr>
                                <Th>#</Th>
                                <Th>Image</Th>
                                <Th>Label</Th>
                                <Th>Durée</Th>
                                <Th>Prix</Th>
                                <Th>Statut</Th>
                                <Th>Actions</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Chargement…</td></tr>
                            ) : niveaux.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Aucun niveau créé.</td></tr>
                            ) : (
                                niveaux.map((n, index) => (
                                    <tr key={n.id} className="border-t border-lavender-100">
                                        <td className="px-4 py-3 text-muted" title={`ordre = ${n.ordre ?? 0}`}>
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            {n.image_url ? (
                                                <div className="h-10 w-10 overflow-hidden rounded-full">
                                                    <img
                                                        src={n.image_url.startsWith('http') ? n.image_url : `${process.env.NEXT_PUBLIC_API_URL}${n.image_url}`}
                                                        className="h-full w-full object-cover"
                                                        alt=""
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-ink">{n.label}</td>
                                        <td className="px-4 py-3 text-muted">{n.duree}</td>
                                        <td className="px-4 py-3 text-muted">{n.prix} DT</td>
                                        <td className="px-4 py-3">
                                            {n.actif === false ? (
                                                <span className="rounded-full bg-lavender-100 px-2.5 py-1 text-xs text-muted">Désactivé</span>
                                            ) : (
                                                <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs text-success-dark">Actif</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => startEdit(n)}
                                                    className="rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-lavender-100"
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(n)}
                                                    disabled={actionLoadingId === n.id}
                                                    className="rounded-lg border border-danger-border px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger-bg disabled:opacity-40"
                                                >
                                                    {actionLoadingId === n.id ? '…' : 'Supprimer'}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1 block text-sm text-ink/80">{label}</span>
            {children}
        </label>
    );
}

function Th({ children }: { children: React.ReactNode }) {
    return <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">{children}</th>;
}