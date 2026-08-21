'use client';

import { FormEvent, Suspense, useMemo, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import Select from '@/components/Select';
import { submitInscription, ApiError, InscriptionPayload, fetchNiveaux } from '@/lib/api';
import { formatPrix, type Niveau, type NiveauId } from '@/lib/niveaux';
import {
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';
import examplePhoneNumbers from 'libphonenumber-js/examples.mobile.json';
import { State, City } from 'country-state-city';

function flagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

const countryNameOf = new Intl.DisplayNames(['fr'], { type: 'region' });

const countryOptions = getCountries()
  .map((code) => {
    const name = countryNameOf.of(code) ?? code;
    return {
      code,
      name, // conservé séparément : sert de clé de tri, sans l'emoji devant
      label: `${flagEmoji(code)} ${name}`,
      dialCode: `+${getCountryCallingCode(code)}`,
    };
  })
  // Trie sur le NOM seul, pas sur "label" (qui commence par l'emoji drapeau
  // et faussait l'ordre alphabétique).
  .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

const genreOptions = [
  { value: 'homme', label: 'Homme' },
  { value: 'femme', label: 'Femme' },
];

const emptyForm: InscriptionPayload = {
  nom: '',
  prenom: '',
  telephone: '',
  email: '',
  genre: 'homme',
  nationalite: '',
  ville: '',
  gouvernorat: '',
  adresse: '',
  profession: '',
  niveau: 'debutant',
  consentementRgpd: false,
};

const professionOptions = [
  { value: 'parfumeur', label: 'Parfumeur', description: 'Crée et compose des parfums en assemblant des matières premières odorantes.' },
  { value: 'createur_parfum', label: 'Créateur de parfum', description: 'Imagine et développe de nouvelles fragrances, souvent pour une marque.' },
  { value: 'assistant_parfumeur', label: 'Assistant parfumeur', description: "Assiste un parfumeur dans la préparation et les essais de formules." },
  { value: 'evaluateur_parfum', label: 'Évaluateur parfum', description: 'Teste et juge la qualité, la tenue et l\'impact olfactif d\'un parfum.' },
  { value: 'technicien_formulation', label: 'Technicien en formulation de parfums', description: 'Prépare les formules en laboratoire selon les dosages définis.' },
  { value: 'chef_projet_parfumerie', label: 'Chef de projet parfumerie', description: 'Coordonne le développement d\'un parfum, du concept au lancement.' },
  { value: 'ingenieur_informatique', label: 'Ingénieur informatique', description: 'Conçoit et développe des logiciels ou systèmes informatiques.' },
  { value: 'etudiant', label: 'Étudiant', description: 'En cours de formation, pas encore en activité professionnelle.' },
  { value: 'autre', label: 'Autre', description: 'Aucune des professions ci-dessus ne correspond à votre situation.' },
];

// Valide qu'une profession "personnalisée" est un texte réel et non
// une lettre isolée ou un mot aléatoire.
function isValidCustomProfession(value: string): boolean {
  const trimmed = value.trim();
  // Au moins 2 mots OU un seul mot d'au moins 4 lettres
  const words = trimmed.split(/\s+/).filter(Boolean);
  const onlyLetters = /^[a-zA-ZÀ-ÿ\s'-]+$/; // lettres, espaces, tirets, accents
  if (!onlyLetters.test(trimmed)) return false;
  if (words.length >= 2) return true;
  return trimmed.length >= 4;
}

function ProfessionSelect({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = professionOptions.find((p) => p.value === value);

  // Fermeture au clic en dehors du composant
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-lg border bg-surface px-4 py-2.5 text-left text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 ${hasError ? 'border-danger-border' : 'border-lavender-200'
          }`}
      >
        <span className={selected ? 'text-ink' : 'text-muted'}>
          {selected ? selected.label : 'Sélectionnez votre profession'}
        </span>
        <span className="text-muted">▾</span>
      </button>

      {open && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-lavender-200 bg-surface py-1 shadow-lg">
          {professionOptions.map((opt) => (
            <li
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="flex cursor-pointer items-center justify-between gap-2 px-4 py-2 text-sm text-ink hover:bg-lavender-50"
            >
              <span>{opt.label}</span>
              <span className="group relative inline-flex shrink-0">
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-lavender-200 text-[9px] leading-none text-muted">
                  ?
                </span>
                <span className="pointer-events-none absolute right-0 top-full z-30 mt-1 w-52 rounded-md bg-ink px-2 py-1.5 text-[11px] leading-tight text-surface opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
                  {opt.description}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type FieldErrors = Partial<Record<keyof InscriptionPayload, string>>;

export default function InscriptionPage() {
  return (
    <Suspense fallback={null}>
      <InscriptionForm />
    </Suspense>
  );
}

function InscriptionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Niveau présélectionné depuis le lien "S'inscrire à ce niveau" du carousel
  // de la page d'accueil (?niveau=debutant|intermediaire|avance). Repli sur
  // "debutant" si absent ou invalide ; ajusté une fois les niveaux chargés
  // depuis l'API (ci-dessous) au cas où l'id de l'URL ne correspondrait à rien.
  const niveauInitial = searchParams.get('niveau') || 'debutant';
  const [form, setForm] = useState<InscriptionPayload>({ ...emptyForm, niveau: niveauInitial });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [niveaux, setNiveaux] = useState<Niveau[]>([]);

  useEffect(() => {
    fetchNiveaux()
      .then((data) => {
        setNiveaux(data);
        // Si le niveau demandé dans l'URL (ou par défaut) n'existe pas parmi
        // les niveaux actifs, on retombe sur le premier disponible.
        setForm((prev) => {
          if (data.some((n) => n.id === prev.niveau)) return prev;
          return data.length > 0 ? { ...prev, niveau: data[0].id } : prev;
        });
      })
      .catch(() => setNiveaux([]));
  }, []);

  const niveauOptions = niveaux.map((n) => ({
    value: n.id,
    label: `${n.label} — ${formatPrix(n.prix)}`,
  }));

  const niveauActuel = niveaux.find((n) => n.id === form.niveau) ?? null;

  const [professionSelect, setProfessionSelect] = useState('');
  const [professionAutre, setProfessionAutre] = useState('');

  // ---------- Téléphone ----------
  const [paysTelephone, setPaysTelephone] = useState<CountryCode>('TN');
  const [telephoneLocal, setTelephoneLocal] = useState('');

  const placeholderTelephone = useMemo(() => {
    const example = getExampleNumber(paysTelephone, examplePhoneNumbers);
    return example ? example.formatNational() : '';
  }, [paysTelephone]);

  const telephoneCountryOptions = useMemo(
    () => countryOptions.map((c) => ({ value: c.code, label: `${c.label} (${c.dialCode})` })),
    []
  );

  // ---------- Nationalité → Gouvernorat → Ville ----------
  const [paysCode, setPaysCode] = useState('');
  const [gouvernoratCode, setGouvernoratCode] = useState('');

  const gouvernoratsDisponibles = useMemo(
    () => (paysCode ? State.getStatesOfCountry(paysCode) : []),
    [paysCode]
  );

  const villesDisponibles = useMemo(() => {
    if (!paysCode) return [];
    if (gouvernoratsDisponibles.length > 0) {
      return gouvernoratCode ? City.getCitiesOfState(paysCode, gouvernoratCode) : [];
    }
    return City.getCitiesOfCountry(paysCode) ?? [];
  }, [paysCode, gouvernoratCode, gouvernoratsDisponibles]);

  const nationaliteOptions = countryOptions.map((c) => ({ value: c.code, label: c.label }));
  const gouvernoratOptions = gouvernoratsDisponibles.map((g) => ({ value: g.isoCode, label: g.name }));
  const villeOptions = villesDisponibles.map((v) => ({ value: v.name, label: v.name }));

  function handlePaysChange(code: string) {
    setPaysCode(code);
    setGouvernoratCode('');
    const pays = countryOptions.find((c) => c.code === code);
    setForm((prev) => ({
      ...prev,
      nationalite: pays?.label.replace(/^\S+\s/, '') ?? '',
      gouvernorat: '',
      ville: '',
    }));
  }

  function handleGouvernoratChange(code: string, labelSiTexteLibre?: string) {
    setGouvernoratCode(code);
    const gouvernorat = labelSiTexteLibre ?? gouvernoratsDisponibles.find((g) => g.isoCode === code)?.name ?? '';
    setForm((prev) => ({ ...prev, gouvernorat, ville: '' }));
  }

  function update<K extends keyof InscriptionPayload>(key: K, value: InscriptionPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    setErrors({});

    if (!isValidPhoneNumber(telephoneLocal, paysTelephone)) {
      setErrors((prev) => ({ ...prev, telephone: 'Numéro invalide pour ce pays' }));
      return;
    }
    const telephoneE164 = parsePhoneNumberFromString(telephoneLocal, paysTelephone)!.format('E.164');

    if (!form.profession || (professionSelect === 'autre' && !isValidCustomProfession(professionAutre))) {
      setErrors((prev) => ({ ...prev, profession: 'Veuillez indiquer une profession valide' }));
      return;
    }

    setLoading(true);
    try {
      await submitInscription({ ...form, telephone: telephoneE164 });
      router.push('/inscription/merci');
    } catch (err) {
      if (err instanceof ApiError) {
        if (Array.isArray(err.details)) {
          const fieldErrors: FieldErrors = {};
          for (const d of err.details as { field: string; message: string }[]) {
            fieldErrors[d.field as keyof InscriptionPayload] = d.message;
          }
          setErrors(fieldErrors);
        }
        setGlobalError(err.message);
      } else {
        setGlobalError('Une erreur inattendue est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-14">
        <h1 className="font-display text-3xl font-semibold text-ink">Inscription à la formation</h1>
        <p className="mt-1 text-muted">Conception de Parfum — {niveauActuel?.label ?? '…'}</p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
          {globalError && (
            <p role="alert" className="rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger-dark">
              {globalError}
            </p>
          )}

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-ink">Niveau choisi</legend>
            <Field label="Niveau de formation" error={errors.niveau}>
              <Select
                value={form.niveau}
                onChange={(v) => update('niveau', v as NiveauId)}
                options={niveauOptions}
              />
            </Field>
            <p className="mt-2 text-sm text-muted">{niveauActuel?.description}</p>
            <p className="mt-1 text-sm font-semibold text-primary">
              Prix : {niveauActuel ? formatPrix(niveauActuel.prix) : '…'}
            </p>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-ink">Informations personnelles</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom" error={errors.nom}>
                <input
                  className={inputClass(!!errors.nom)}
                  value={form.nom}
                  onChange={(e) => update('nom', e.target.value)}
                  required
                />
              </Field>
              <Field label="Prénom" error={errors.prenom}>
                <input
                  className={inputClass(!!errors.prenom)}
                  value={form.prenom}
                  onChange={(e) => update('prenom', e.target.value)}
                  required
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Téléphone" error={errors.telephone}>
                  <div className="flex gap-2">
                    <div className="w-48">
                      <Select
                        value={paysTelephone}
                        onChange={(v) => setPaysTelephone(v as CountryCode)}
                        options={telephoneCountryOptions}
                      />
                    </div>
                    <input
                      type="tel"
                      className={inputClass(!!errors.telephone)}
                      value={telephoneLocal}
                      onChange={(e) => setTelephoneLocal(e.target.value)}
                      placeholder={placeholderTelephone}
                      required
                    />
                  </div>
                </Field>
              </div>

              <Field label="E-mail" error={errors.email}>
                <input
                  type="email"
                  className={inputClass(!!errors.email)}
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="votre.email@exemple.com"
                  required
                />
              </Field>
              <Field label="Genre" error={errors.genre}>
                <Select
                  value={form.genre}
                  onChange={(v) => update('genre', v as 'homme' | 'femme')}
                  options={genreOptions}
                />
              </Field>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-ink">
              Nationalité et lieu d&apos;habitation
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Nationalité" error={errors.nationalite}>
                  <Select
                    value={paysCode}
                    onChange={handlePaysChange}
                    options={nationaliteOptions}
                    placeholder="Sélectionnez un pays"
                    hasError={!!errors.nationalite}
                  />
                </Field>
              </div>

              <Field label="Gouvernorat / Région" error={errors.gouvernorat}>
                {gouvernoratsDisponibles.length > 0 ? (
                  <Select
                    value={gouvernoratCode}
                    onChange={(v) => handleGouvernoratChange(v)}
                    options={gouvernoratOptions}
                    placeholder={paysCode ? 'Sélectionnez un gouvernorat' : "Choisissez d'abord la nationalité"}
                    disabled={!paysCode}
                    hasError={!!errors.gouvernorat}
                  />
                ) : (
                  <input
                    className={inputClass(!!errors.gouvernorat)}
                    value={form.gouvernorat}
                    onChange={(e) => handleGouvernoratChange('', e.target.value)}
                    placeholder={paysCode ? 'Saisissez votre région' : "Choisissez d'abord la nationalité"}
                    disabled={!paysCode}
                    required
                  />
                )}
              </Field>

              <Field label="Ville" error={errors.ville}>
                {villesDisponibles.length > 0 ? (
                  <Select
                    value={form.ville}
                    onChange={(v) => update('ville', v)}
                    options={villeOptions}
                    placeholder="Sélectionnez une ville"
                    disabled={!paysCode || (gouvernoratsDisponibles.length > 0 && !gouvernoratCode)}
                    hasError={!!errors.ville}
                  />
                ) : (
                  <input
                    className={inputClass(!!errors.ville)}
                    value={form.ville}
                    onChange={(e) => update('ville', e.target.value)}
                    placeholder={paysCode ? 'Saisissez votre ville' : "Choisissez d'abord la nationalité"}
                    disabled={!paysCode}
                    required
                  />
                )}
              </Field>

              <div className="sm:col-span-2">
                <Field label="Adresse (optionnel)" error={errors.adresse}>
                  <input
                    className={inputClass(!!errors.adresse)}
                    value={form.adresse}
                    onChange={(e) => update('adresse', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-ink">Profession</legend>
            <Field label="Métier / profession" error={errors.profession}>
              <ProfessionSelect
                value={professionSelect}
                onChange={(v) => {
                  setProfessionSelect(v);
                  if (v !== 'autre') {
                    setProfessionAutre('');
                    const label = professionOptions.find((p) => p.value === v)?.label ?? '';
                    update('profession', label);
                  } else {
                    update('profession', '');
                  }
                }}
                hasError={!!errors.profession}
              />
            </Field>

            {professionSelect === 'autre' && (
              <div className="mt-3">
                <Field label="Précisez votre profession" error={errors.profession}>
                  <input
                    className={inputClass(!!errors.profession)}
                    value={professionAutre}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProfessionAutre(val);
                      update('profession', val);
                    }}
                    placeholder="Ex : Chimiste, Designer olfactif..."
                    required
                  />
                </Field>
              </div>
            )}
          </fieldset>

          <label className="flex items-start gap-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.consentementRgpd}
              onChange={(e) => update('consentementRgpd', e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-lavender-200 text-primary focus:ring-primary"
            />
            <span>
              J&apos;accepte que mes données soient utilisées pour la gestion de mon inscription,
              conformément à la{' '}
              <a href="/confidentialite" className="text-primary hover:underline">
                politique de confidentialité
              </a>
              .
            </span>
          </label>
          {errors.consentementRgpd && <p className="text-sm text-danger">{errors.consentementRgpd}</p>}

          <Button type="submit" loading={loading} className="w-full">
            Valider mon inscription
          </Button>
        </form>
      </main>
      <Footer />
    </>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-lavender-50 disabled:text-muted ${hasError ? 'border-danger-border' : 'border-lavender-200'
    }`;
}

function Field({ label, error, children }: { label: string | React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-ink/80">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}