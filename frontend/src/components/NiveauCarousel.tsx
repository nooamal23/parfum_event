'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPrix, type Niveau } from '@/lib/niveaux';
import { fetchNiveaux } from '@/lib/api';

export default function NiveauCarousel() {
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetchNiveaux().then(setNiveaux).catch(() => setNiveaux([]));
  }, []);

  if (niveaux.length === 0) return null; // ou un skeleton de chargement

  function goTo(i: number) {
    setIndex((i + niveaux.length) % niveaux.length);
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  return (
    <div>
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {niveaux.map((niveau) => (
              <div key={niveau.id} className="w-full shrink-0">
                <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
                  Formation
                </p>
                <h1 className="font-display text-5xl font-semibold leading-tight text-ink">
                  {niveau.titre.split(' de ')[0]}
                  <br />
                  de {niveau.titre.split(' de ')[1]}
                </h1>
                <p className="mt-2 font-script text-3xl text-primary">{niveau.label}</p>
                <p className="mt-6 max-w-md text-muted">{niveau.description}</p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-gold/15 px-4 py-1.5 text-sm font-semibold text-gold-dark">
                    {formatPrix(niveau.prix)}
                  </span>
                  <span className="text-sm text-muted">· {niveau.duree}</span>
                  <span className="text-sm text-muted">· {niveau.prerequis}</span>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href="#formation"
                    className="rounded-lg bg-primary px-7 py-3.5 font-medium text-surface shadow-card transition hover:bg-primary-dark"
                  >
                    Découvrir la formation
                  </a>

                  <Link
                    href={`/inscription?niveau=${niveau.id}`}
                    className="rounded-lg border border-primary px-7 py-3.5 font-medium text-primary transition hover:bg-lavender-100"
                  >
                    S&apos;inscrire à ce niveau
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex gap-2">
              {niveaux.map((niveau, i) => (
                <button
                  key={niveau.id}
                  type="button"
                  aria-label={`Voir ${niveau.label}`}
                  aria-current={i === index}
                  onClick={() => goTo(i)}
                  className={`h-2.5 rounded-full transition-all ${i === index ? 'w-6 bg-primary' : 'w-2.5 bg-lavender-200 hover:bg-lavender-200/80'
                    }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-4 py-2 text-sm font-medium text-primary transition hover:bg-lavender-100"
            >
              Niveau suivant
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>

        <div className="relative mx-auto h-72 w-72 overflow-hidden rounded-full bg-surface/60 shadow-card md:h-96 md:w-96">
          {niveaux[index].image_url ? (
            <img
              src={
                niveaux[index].image_url!.startsWith('http')
                  ? niveaux[index].image_url!
                  : `${apiBase}${niveaux[index].image_url}`
              }
              alt={niveaux[index].titre}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-center">
              <div>
                <span className="font-script text-4xl text-primary/70">Eau de Parfum</span>
                <span className="mt-2 block text-sm font-medium uppercase tracking-widest text-primary/60">
                  {niveaux[index].accroche}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}