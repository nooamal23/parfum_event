/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" produit un build autonome minimal (node_modules réduits aux
  // dépendances réellement utilisées) : indispensable pour une image Docker légère.
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
