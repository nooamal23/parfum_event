export type NiveauId = string;

export interface Niveau {
  id: NiveauId;
  label: string;
  titre: string;
  accroche: string;
  description: string;
  prix: number;
  duree: string;
  prerequis: string;
  image_url: string | null;
  // Champs renvoyés uniquement par /admin/niveaux (SELECT *), absents de l'API publique.
  ordre?: number;
  actif?: boolean;
}

export function formatPrix(prix: number): string {
  return `${prix} DT`;
}