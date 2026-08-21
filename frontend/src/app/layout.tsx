import type { Metadata } from 'next';
import './globals.css'; // adapte selon ton projet

export const metadata: Metadata = {
  title: 'PARFUMACADEMY',
  description: 'Ta description',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}