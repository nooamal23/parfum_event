#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Vérification de la présence de .env.example"
if [[ ! -f ".env.example" ]]; then
  echo "ERREUR: .env.example est absent à la racine du projet." >&2
  exit 1
fi

echo "==> Extraction des variables utilisées dans docker-compose.yml"
COMPOSE_VARS=$(grep -oE '\$\{[A-Za-z_][A-Za-z0-9_]*(:-[^}]*)?\}' docker-compose.yml \
  | sed -E 's/\$\{([A-Za-z_][A-Za-z0-9_]*).*/\1/' | sort -u)

EXAMPLE_VARS=$(grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' .env.example | sed 's/=$//' | sort -u)

MISSING=""
for v in $COMPOSE_VARS; do
  if ! grep -qx "$v" <<< "$EXAMPLE_VARS"; then
    MISSING="$MISSING $v"
  fi
done

if [[ -n "$MISSING" ]]; then
  echo "ERREUR: variables utilisées dans docker-compose.yml mais absentes de .env.example:" >&2
  echo "$MISSING" >&2
  exit 1
fi
echo "OK: toutes les variables de docker-compose.yml sont documentées dans .env.example"

echo "==> Validation syntaxique de docker-compose.yml (valeurs factices)"
ENV_BACKUP=""
if [[ -f .env ]]; then
  ENV_BACKUP="$(mktemp)"
  cp .env "$ENV_BACKUP"
fi
cleanup() {
  if [[ -n "$ENV_BACKUP" ]]; then
    cp "$ENV_BACKUP" .env
    rm -f "$ENV_BACKUP"
  else
    rm -f .env
  fi
}
trap cleanup EXIT

: > .env
while IFS='=' read -r key _; do
  [[ -z "$key" || "$key" == \#* ]] && continue
  if [[ "$key" == *PORT* ]]; then
    echo "${key}=5000" >> .env
  else
    echo "${key}=dummy_value_for_ci" >> .env
  fi
done < .env.example

if command -v docker &> /dev/null && docker compose version &> /dev/null; then
  docker compose config -q
  echo "OK: docker-compose.yml est syntaxiquement valide"
else
  echo "AVERTISSEMENT: docker compose non disponible dans cet environnement, étape ignorée"
fi

echo "==> Terminé sans erreur"
