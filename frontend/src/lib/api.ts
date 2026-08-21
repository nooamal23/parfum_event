// Client API unique : tout appel réseau vers le backend passe par ici.
// Centraliser l'URL de base et la gestion d'erreur évite de dupliquer
// fetch(...) partout dans les pages/composants.

import { Niveau } from "./niveaux";

// IMPORTANT (Docker/SSR) : deux contextes d'exécution ont besoin de deux URLs différentes.
// - Navigateur (Client Components) -> URL PUBLIQUE de l'API (domaine réel en prod).
// - Next.js côté serveur (Server Components, SSR) -> tourne DANS le conteneur frontend ;
//   "localhost" y désigne le conteneur frontend lui-même, pas le backend. Il faut donc
//   utiliser le nom du service Docker Compose (ex. http://backend:4000).
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const INTERNAL_API_URL = process.env.API_URL_INTERNAL || PUBLIC_API_URL;

function resolveApiUrl(): string {
  return typeof window === 'undefined' ? INTERNAL_API_URL : PUBLIC_API_URL;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${resolveApiUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store',
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(body?.error || 'Une erreur est survenue.', res.status, body?.details);
  }

  return body as T;
}

// ---------- Inscription publique ----------

export interface InscriptionPayload {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  genre: 'homme' | 'femme';
  nationalite: string;
  ville: string;
  gouvernorat: string;
  adresse?: string;
  profession: string;
  niveau: string;
  consentementRgpd: boolean;
}

export function submitInscription(payload: InscriptionPayload) {
  return request<{ message: string }>('/api/inscriptions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function validateEmailToken(token: string) {
  return request<{ message: string; alreadyConfirmed?: boolean }>(
    `/api/inscriptions/valider/${token}`
  );
}

// ---------- Back-office admin ----------

export interface Participant {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  genre: string;
  nationalite: string;
  ville: string;
  gouvernorat: string;
  profession: string;
  niveau: string;
  prix: number;
  status: 'en_attente_validation' | 'confirmee';
  created_at: string;
  confirmed_at: string | null;
  info_email_sent_at: string | null;
  ip_address: string | null;
}

export function adminLogin(email: string, password: string) {
  return request<{ token: string; admin: { id: string; email: string; nom: string } }>(
    '/api/admin/login',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  );
}

export function fetchParticipants(token: string, status?: string) {
  const qs = status ? `?status=${status}` : '';
  return request<{ items: Participant[]; total: number; page: number; pageSize: number }>(
    `/api/admin/participants${qs}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export function deleteParticipant(token: string, id: string) {
  return request<{ message: string }>(`/api/admin/participants/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function sendInfoEmail(token: string, id: string) {
  return request<{ message: string; participant: Participant }>(
    `/api/admin/participants/${id}/envoyer-info`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
  );
}

export function fetchStats(token: string) {
  return request<{ total_inscrits: number; total_confirmes: number; total_en_attente: number }>(
    '/api/admin/stats',
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

/************************* */

export function fetchNiveaux() {
  return request<Niveau[]>('/api/niveaux');
}

export function fetchNiveauxAdmin(token: string) {
  return request<Niveau[]>('/api/admin/niveaux', { headers: { Authorization: `Bearer ${token}` } });
}

// FormData => ne PAS mettre 'Content-Type' (le navigateur fixe la boundary multipart lui-même)
export async function createNiveau(token: string, formData: FormData) {
  const res = await fetch(`${resolveApiUrl()}/api/admin/niveaux`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new ApiError((await res.json())?.error || 'Erreur', res.status);
  return res.json();
}

export async function updateNiveau(token: string, id: string, formData: FormData) {
  const res = await fetch(`${resolveApiUrl()}/api/admin/niveaux/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new ApiError((await res.json())?.error || 'Erreur', res.status);
  return res.json();
}

export function deleteNiveau(token: string, id: string) {
  return request<{ message: string }>(`/api/admin/niveaux/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}