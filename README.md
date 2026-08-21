# Univers des Parfums — Plateforme d'événement

Module livré dans cette itération : **pré-inscription + double validation par e-mail + liste des inscrits (admin)**.
Le module QCM / QR code (étapes de l'événement) n'est volontairement pas inclus ici : cette base est conçue pour l'accueillir dans un sprint suivant sans réécriture.

## Structure du repo

```
parfum-event/
├── backend/              # API REST — Node.js / Express / PostgreSQL
│   └── src/
│       ├── config/        # variables d'env, connexion DB
│       ├── db/migrations/ # schéma SQL versionné
│       ├── middlewares/   # auth, validation, erreurs, rate-limit
│       ├── routes/        # définition des endpoints
│       ├── controllers/   # logique HTTP (req/res)
│       ├── services/      # logique métier (email, token, auth)
│       ├── repositories/  # accès aux données (SQL)
│       └── validators/    # schémas de validation des payloads
├── frontend/              # Next.js (App Router, TypeScript, Tailwind)
│   └── src/
│       ├── app/            # pages : accueil, inscription, admin
│       ├── components/     # UI réutilisable
│       └── lib/            # client API
├── docker-compose.yml          # base, orientée production (images optimisées)
├── docker-compose.override.yml # ajouts dev : hot-reload, port DB exposé (auto-chargé par `docker compose up`)
└── .env.example
```

## Démarrage rapide (dev)

```bash
cp .env.example .env
docker compose up --build
```

`docker compose` charge automatiquement `docker-compose.yml` **et** `docker-compose.override.yml` (hot-reload nodemon / `next dev`, port PostgreSQL exposé sur l'hôte pour s'y connecter avec un client SQL).

- Frontend : http://localhost:3000
- API : http://localhost:4000
- PostgreSQL : localhost:5432

Le service `migrate` applique `backend/src/db/migrations/001_init.sql` (et crée le compte admin de bootstrap) avant que `backend` ne démarre.

## Démarrage en production

```bash
docker compose -f docker-compose.yml up -d --build
```

En précisant `-f docker-compose.yml` seul, le fichier `override` (dev) n'est **pas** chargé : on obtient les images multi-stage optimisées (sans dépendances dev, utilisateur non-root), sans volume de code source, sans port PostgreSQL exposé. Il ne reste qu'à placer un reverse proxy externe (Nginx / Traefik / Caddy) devant `frontend` (port 3000) et `backend` (port 4000) pour la terminaison HTTPS.

## Architecture applicative

**Backend** — architecture en couches, chaque couche a une seule responsabilité :

```
route → controller → service → repository → PostgreSQL
                ↑
           validator (validation d'entrée avant d'atteindre le controller)
```

- `repositories/` est le seul endroit qui écrit du SQL. Si on change de moteur de BDD un jour, seul ce dossier bouge.
- `services/` porte la logique métier (générer un token, envoyer un email, hasher un mot de passe) — testable indépendamment du HTTP.
- Aucune requête SQL n'est construite par concaténation de chaînes : uniquement des requêtes paramétrées (`$1, $2...`) pour éviter les injections SQL.

**Frontend** — Next.js App Router, rendu majoritairement côté serveur pour les pages publiques (SEO, perf), et client components uniquement où l'interactivité l'exige (formulaire, tableau admin).

## Sécurité (déjà en place dans cette base)

- Mots de passe admin hashés avec bcrypt (jamais stockés en clair).
- Sessions admin par JWT signé, expiration courte + refresh possible.
- Token de validation d'e-mail : aléatoire cryptographique (32 octets), à usage unique, expiration 1h (configurable), stocké hashé en base.
- `helmet` (en-têtes HTTP sécurisés), `cors` restreint à l'origine du frontend, `express-rate-limit` sur les routes sensibles (inscription, login).
- Toutes les requêtes SQL sont paramétrées.
- Variables sensibles (SMTP, secrets JWT, credentials DB) exclusivement via variables d'environnement, jamais commitées (`.env` est dans `.gitignore`).

## Points ouverts (cf. cahier des charges, section ⛔️)

- Durée de vie du token de confirmation : actuellement paramétrable via `EMAIL_TOKEN_TTL_MINUTES` (défaut 60 min).
- Règle "une seule demande d'inscription par session d'événement" : la table `participants` a une contrainte d'unicité sur `email`. Si plusieurs sessions/dates doivent coexister, il faudra ajouter une colonne `event_session_id` et déplacer la contrainte d'unicité sur `(email, event_session_id)` — prévu mais non activé tant que ce point n'est pas validé avec M. Atef.
