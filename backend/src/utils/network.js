// Node.js/Express renvoie parfois l'IP client préfixée "::ffff:" (notation
// IPv4-mappée-en-IPv6, propre aux sockets dual-stack) — ex. "::ffff:172.18.0.1"
// au lieu de "172.18.0.1". On la retire pour un affichage/stockage plus lisible.
// N'affecte pas les vraies adresses IPv6 (qui ne commencent jamais par ce préfixe).
function normalizeIp(ip) {
  if (!ip) return null;
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

module.exports = { normalizeIp };
