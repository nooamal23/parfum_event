# Déploiement en production sur un VPS

Guide pour un VPS Ubuntu 22.04/24.04 vierge (Debian similaire). Compte non-root avec
accès `sudo` recommandé plutôt que `root` directement.

## 0. Prérequis avant de commencer

- Un nom de domaine pointant vers l'IP du VPS : au minimum deux enregistrements DNS de
  type A — `mondomaine.tn` et `api.mondomaine.tn` (ou un sous-domaine de votre choix)
  — pointant tous les deux vers l'IP publique du VPS. Vérifiez la propagation avec
  `dig mondomaine.tn` avant de continuer.
- ⚠️ **Étape bloquante, à faire AVANT tout build de production** : ce projet livré
  n'a pas de `package-lock.json` (générés localement, jamais commités par erreur).
  Les `Dockerfile` de production utilisent `npm ci`, qui **exige** ce fichier.
  Sur votre machine de dev, avec Node.js installé :
  ```bash
  cd backend && npm install && cd ..
  cd frontend && npm install && cd ..
  ```
  Committez les deux `package-lock.json` générés avant de transférer le projet sur le VPS.

## 1. Installer Docker et Nginx sur le VPS

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # puis se reconnecter (logout/login) pour appliquer
sudo apt install -y nginx certbot python3-certbot-nginx
```

## 2. Transférer le projet

Depuis votre machine locale (remplacez `user@vps-ip`) :
```bash
rsync -avz --exclude node_modules --exclude .next --exclude .git \
  ./parfum-event/ user@vps-ip:~/parfum-event/
```

## 3. Configurer les variables de production

Sur le VPS :
```bash
cd ~/parfum-event
cp .env.example .env
nano .env
```

Valeurs à changer impérativement (ne jamais garder les valeurs par défaut/exemple) :

| Variable | Valeur en production |
|---|---|
| `NODE_ENV` | `production` |
| `POSTGRES_PASSWORD` | mot de passe fort et unique |
| `DATABASE_URL` | reprendre le même mot de passe que ci-dessus |
| `FRONTEND_URL` | `https://mondomaine.tn` |
| `JWT_SECRET` | générer avec `openssl rand -hex 32` — **ne réutilisez pas** une valeur déjà partagée ailleurs (Slack, chat, etc.) |
| `ADMIN_BOOTSTRAP_PASSWORD` | mot de passe fort, à changer après la première connexion |
| `SMTP_*` | vos identifiants d'un vrai fournisseur (voir note ci-dessous) |
| `NEXT_PUBLIC_API_URL` | `https://api.mondomaine.tn` |
| `API_URL_INTERNAL` | `http://backend:4000` (ne pas changer, nom du service Docker) |

**Note SMTP** : Gmail fonctionne pour tester mais limite à ~500 e-mails/jour et peut
marquer vos envois comme spam en cas de pic (le jour de l'événement, potentiellement
plusieurs dizaines/centaines d'e-mails en peu de temps). Pour la production, préférez
un service transactionnel : Brevo (300/jour gratuits) ou Resend, avec authentification
SPF/DKIM sur votre domaine — meilleure délivrabilité.

## 4. Lancer la stack en mode production

```bash
docker compose -f docker-compose.yml up -d --build
docker compose ps   # vérifier que tout est "healthy" / "running"
docker compose logs -f backend   # vérifier l'absence d'erreur au démarrage
```

Le fichier `docker-compose.override.yml` n'est **pas** chargé ici (on précise
`-f docker-compose.yml` explicitement) : images optimisées, ports liés à
`127.0.0.1` uniquement (non exposés directement à Internet).

## 5. Configurer Nginx (reverse proxy)

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/parfum-event
sudo nano /etc/nginx/sites-available/parfum-event   # remplacer mondomaine.tn par votre vrai domaine
sudo ln -s /etc/nginx/sites-available/parfum-event /etc/nginx/sites-enabled/
sudo nginx -t   # doit afficher "syntax is ok" / "test is successful"
sudo systemctl reload nginx
```

## 6. Activer HTTPS avec Certbot

```bash
sudo certbot --nginx -d mondomaine.tn -d www.mondomaine.tn -d api.mondomaine.tn
```

Certbot modifie automatiquement la config Nginx pour ajouter HTTPS et la redirection
HTTP → HTTPS, et programme le renouvellement automatique des certificats (à vérifier
avec `sudo certbot renew --dry-run`).

## 7. Vérifications finales

- `https://mondomaine.tn` charge la page d'accueil.
- `https://api.mondomaine.tn/api/health` renvoie `{"status":"ok"}`.
- Un test d'inscription complet fonctionne de bout en bout (formulaire → e-mail reçu →
  clic sur le lien → statut "confirmée" visible dans `/admin/participants`).
- `docker compose logs backend` ne montre aucune erreur SMTP/DB après le test.

## 8. Sauvegardes PostgreSQL (recommandé avant l'événement)

```bash
# Sauvegarde manuelle
docker compose exec db pg_dump -U parfum_user parfum_event > backup_$(date +%F).sql

# Automatiser via une tâche cron (ex. tous les jours à 3h) :
# crontab -e, puis ajouter :
# 0 3 * * * cd ~/parfum-event && docker compose exec -T db pg_dump -U parfum_user parfum_event > ~/backups/parfum_$(date +\%F).sql
```

## 9. Répétition technique avant le jour J

Le cahier des charges recommande un test de charge simulant le scan simultané par
l'ensemble des participants attendus (§4.3). À faire une fois le module QCM/QR code
(sprint 3) implémenté — outil recommandé : [k6](https://k6.io/) ou
[Apache Bench](https://httpd.apache.org/docs/2.4/programs/ab.html) pour simuler
plusieurs dizaines de requêtes simultanées vers l'API.
