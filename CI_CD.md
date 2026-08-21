# CI/CD — parfum-event

Pipeline GitHub Actions unique : `.github/workflows/pipeline.yml`.

## Ce que fait le pipeline

Sur chaque **push** ou **pull request** vers `main` ou `dev` :

| Étape | Job | Bloquant ? |
|---|---|---|
| Lint backend (ESLint) | `lint-backend` | oui |
| Lint frontend (`next lint`) | `lint-frontend` | oui |
| Tests backend (Jest + Postgres de test) | `test-backend` | oui |
| Build de validation frontend (`next build`) | `build-frontend` | oui |
| Analyse statique de sécurité (CodeQL) | `codeql` | oui |
| Audit des dépendances (`npm audit`, seuil high/critical) | `dependency-scan` | oui |
| Détection de secrets exposés (gitleaks) | `secret-scan` | oui |
| Cohérence `.env.example` / `docker-compose.yml` | `env-check` | oui |
| Build des images Docker + lint Dockerfile (hadolint) + scan de vulnérabilités (Trivy, CRITICAL/HIGH) | `docker-build-scan` | oui |

Le déploiement (`deploy-staging` / `deploy-production`) a un `needs:` sur **tous** les jobs ci-dessus : si un seul échoue, le déploiement ne se déclenche pas.

- Push sur `dev` → déploiement automatique sur l'environnement **staging**.
- Push sur `main` → déploiement automatique sur l'environnement **production**.
- Les pull requests ne déploient jamais, elles ne font que valider.

## À faire une fois, côté GitHub

### 1. Créer les secrets du dépôt

`Settings → Secrets and variables → Actions → Secrets`

| Secret | Description |
|---|---|
| `STAGING_SSH_HOST` | IP/nom d'hôte du VPS de staging |
| `STAGING_SSH_USER` | Utilisateur SSH (jamais root idéalement) |
| `STAGING_SSH_KEY` | Clé privée SSH dédiée (voir ci-dessous) |
| `STAGING_SSH_PORT` | Optionnel, défaut 22 |
| `PROD_SSH_HOST` | IP/nom d'hôte du VPS de production |
| `PROD_SSH_USER` | Utilisateur SSH |
| `PROD_SSH_KEY` | Clé privée SSH dédiée |
| `PROD_SSH_PORT` | Optionnel, défaut 22 |

**Ne réutilisez pas votre clé SSH personnelle.** Générez une paire dédiée au déploiement :

```bash
ssh-keygen -t ed25519 -f deploy_key -C "github-actions-parfum-event" -N ""
# Ajouter deploy_key.pub à ~/.ssh/authorized_keys sur le VPS (avec 'command=' restreint si possible)
# Coller le contenu de deploy_key (clé privée) dans le secret GitHub *_SSH_KEY
```

Le fichier `.env` réel **reste uniquement sur le VPS**, il n'est jamais dans le dépôt ni dans les secrets GitHub — le déploiement fait juste `git pull` + `docker compose up --build`, et `docker compose` lit le `.env` déjà présent sur le serveur (`env_file: .env` dans `docker-compose.yml`).

### 2. (Optionnel) Variables non sensibles

`Settings → Secrets and variables → Actions → Variables`

- `STAGING_DEPLOY_PATH`, `PROD_DEPLOY_PATH` : chemin du projet sur le VPS (défaut `/opt/parfum-event`)
- `STAGING_URL`, `PRODUCTION_URL` : affichées dans l'onglet "Environments" de GitHub

### 3. Créer les environnements GitHub

`Settings → Environments` → créer `staging` et `production`.

Pour `production`, activez **"Required reviewers"** : ça ajoute une validation manuelle obligatoire avant le déploiement, même si tous les checks sont verts. C'est la ceinture de sécurité en plus du pipeline automatique.

### 4. Protéger les branches

`Settings → Branches → Branch protection rules` pour `main` et `dev` :

- Require a pull request before merging
- Require status checks to pass before merging → sélectionner tous les jobs du pipeline
- Require branches to be up to date before merging
- Interdire le force-push et la suppression de branche

### 5. Secret scanning natif GitHub

`Settings → Code security` → activer **Secret scanning** et **Push protection** (bloque un `git push` contenant un secret reconnu, en complément de gitleaks qui tourne côté CI).

## À faire une fois, côté code

1. **Route de santé** — si elle n'existe pas, ajoutez dans `backend/src/routes/index.js` :
   ```js
   router.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
   ```
2. **Export de l'app Express** pour les tests — vérifiez que `backend/src/app.js` fait bien `module.exports = app;` (sans appeler `app.listen()`, qui doit rester dans `server.js`).
3. Installer les nouvelles dépendances localement avant de commit :
   ```bash
   cd backend && npm install
   ```
4. Sur chaque VPS (staging + production), cloner une fois le dépôt et déposer le `.env` réel :
   ```bash
   git clone <votre-repo> /opt/parfum-event
   cd /opt/parfum-event
   cp .env.example .env   # puis éditer avec les vraies valeurs
   ```

## Pourquoi ces choix

- **Un seul workflow** avec des `needs:` explicites, plutôt que CI et CD séparés : ça garantit mécaniquement qu'un échec de test ou de scan bloque le déploiement, sans dépendre d'un déclenchement `workflow_run` plus fragile à synchroniser.
- **Trivy + hadolint** sur les images buildées (et non juste le code source) : une CVE peut venir de l'image de base (`node:20-alpine` par ex.) et pas seulement de vos dépendances npm.
- **gitleaks en CI + push protection GitHub** : deux filets différents, l'un bloque le push lui-même, l'autre audite tout l'historique à chaque run.
- **Environnements GitHub avec "required reviewers" sur production** : le pipeline peut avoir un bug un jour ; une validation humaine avant prod reste la meilleure protection finale.
