import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Politique de confidentialité — Univers des Parfums',
};

// Contenu de base à faire valider par l'organisateur avant la mise en production
// (cf. cahier des charges §3.5 : durée de conservation, base légale exacte, etc.).
export default function ConfidentialitePage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold text-ink">Politique de confidentialité</h1>
        <p className="mt-2 text-sm text-muted">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink/90">
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Données collectées</h2>
            <p className="mt-2">
              Lors de votre inscription à l&apos;événement Univers des Parfums, nous collectons : nom,
              prénom, numéro de téléphone, adresse e-mail, genre, nationalité, ville, gouvernorat,
              adresse (optionnelle) et profession.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Finalité</h2>
            <p className="mt-2">
              Ces données sont utilisées exclusivement pour la gestion de votre inscription (validation
              de l&apos;adresse e-mail, envoi des informations pratiques) et pour établir des
              statistiques agrégées et anonymisées sur les participants à l&apos;événement.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Conservation</h2>
            <p className="mt-2">
              Vos données sont conservées pendant la durée nécessaire à l&apos;organisation de
              l&apos;événement, puis supprimées ou anonymisées dans un délai raisonnable, sauf obligation
              légale contraire.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Vos droits</h2>
            <p className="mt-2">
              Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données en
              contactant l&apos;organisateur de l&apos;événement.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
