import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import NiveauCarousel from '@/components/NiveauCarousel';

const highlights = [
  { title: 'Formation pratique', desc: 'Apprenez en réalisant vos propres créations.' },
  { title: 'Formateur expert', desc: 'Des professionnels de la parfumerie à vos côtés.' },
  //{ title: 'Certificat inclus', desc: 'Recevez un certificat à la fin de la formation.' },
  { title: 'Accessible à tous', desc: 'Aucune expérience préalable requise.' },
];

const programme = [
  { step: '1', title: 'Introduction', desc: "Premiers pas dans la conception de parfum." },
  { step: '2', title: 'Les familles olfactives', desc: 'Comprendre les grandes familles et leurs équilibres.' },
  { step: '3', title: 'Composition', desc: 'Construire une pyramide olfactive équilibrée.' },
  { step: '4', title: 'QCM', desc: 'Validez vos acquis étape par étape.' },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        {/* Hero : carousel des 3 niveaux (Débutant / Intermédiaire / Avancé) */}
        <section className="relative overflow-hidden bg-gradient-to-b from-lavender-100 to-lavender-50">
          <NiveauCarousel />
        </section>

        {/* Points forts */}
        <section id="formation" className="border-y border-lavender-200 bg-surface">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-8 px-6 py-14">
            {highlights.map((item) => (
              <div key={item.title} className="w-full max-w-[220px] text-center sm:w-56">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-lavender-100 text-primary">
                  ✦
                </div>
                <h3 className="font-display text-base font-semibold text-ink">{item.title}</h3>
                <p className="mt-1 text-sm text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Programme */}
        <section id="programme" className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center font-display text-3xl font-semibold text-ink">
            Programme de la formation
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-muted">
            Une approche complète pour maîtriser les bases de la parfumerie.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {programme.map((item) => (
              <div key={item.step} className="rounded-xl2 border border-lavender-200 bg-surface p-6 shadow-card">
                <span className="font-display text-2xl font-semibold text-primary">{item.step}</span>
                <h3 className="mt-2 font-display font-semibold text-ink">{item.title}</h3>
                <p className="mt-1 text-sm text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section id="contact" className="bg-primary">
          <div className="mx-auto max-w-4xl px-6 py-14 text-center text-surface">
            <h2 className="font-display text-2xl font-semibold">Places limitées pour cette session</h2>
            <p className="mt-2 text-surface/80">
              Confirmez votre participation dès maintenant, la validation se fait en deux étapes simples.
            </p>
            <Link
              href="/inscription"
              className="mt-6 inline-block rounded-lg bg-surface px-7 py-3.5 font-medium text-primary shadow-card transition hover:bg-lavender-50"
            >
              Je m&apos;inscris
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
