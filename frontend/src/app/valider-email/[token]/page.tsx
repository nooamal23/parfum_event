import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { validateEmailToken, ApiError } from '@/lib/api';

interface Props {
  params: Promise<{ token: string }>;
}

// Server Component : la validation se fait côté serveur au chargement de la page,
// pas besoin de JS côté client pour ce cas d'usage simple (lien cliqué depuis un e-mail).
export default async function ValiderEmailPage({ params }: Props) {
  const { token } = await params;
  let result: { message: string; success: boolean };

  try {
    const res = await validateEmailToken(token);
    result = { message: res.message, success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Une erreur est survenue lors de la validation.";
    result = { message, success: false };
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
        <div
          className={`mb-6 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
            result.success ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
          }`}
        >
          {result.success ? '✓' : '✕'}
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          {result.success ? 'Inscription confirmée' : 'Validation impossible'}
        </h1>
        <p className="mt-3 text-muted">{result.message}</p>

        {!result.success && (
          <Link href="/inscription" className="mt-8 text-sm font-medium text-primary hover:underline">
            Retourner au formulaire d&apos;inscription
          </Link>
        )}
        {result.success && (
          <Link href="/" className="mt-8 text-sm font-medium text-primary hover:underline">
            Retour à l&apos;accueil
          </Link>
        )}
      </main>
      <Footer />
    </>
  );
}
