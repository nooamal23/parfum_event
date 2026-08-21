import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function MerciPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-lavender-100 text-3xl text-primary">
          ✉️
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Merci pour votre inscription !
        </h1>
        <p className="mt-3 text-muted">
          Un e-mail de confirmation vient de vous être envoyé. Ouvrez-le et cliquez sur le lien de
          validation pour finaliser votre inscription à l&apos;événement.
        </p>
        <p className="mt-2 text-sm text-muted">
          Le lien est valable pendant une durée limitée. Pensez à vérifier vos courriers indésirables
          si vous ne le voyez pas apparaître.
        </p>
        <Link href="/" className="mt-8 text-sm font-medium text-primary hover:underline">
          Retour à l&apos;accueil
        </Link>
      </main>
      <Footer />
    </>
  );
}
