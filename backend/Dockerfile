# syntax=docker/dockerfile:1

# ---------- Étape 1 : dépendances ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---------- Étape 2 : image de production ----------
FROM node:20-alpine AS production
RUN apk update && apk upgrade --no-cache
# npm est inutile en production (le CMD ne lance que node, jamais npm/npx) :
# on le retire pour ne pas embarquer ses dépendances internes vulnérables
# (ex. tar, sigstore) dans l'image finale.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
RUN mkdir -p uploads/niveaux && chown -R appuser:appgroup uploads

USER appuser

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', r => process.exit(r.statusCode===200?0:1)).on('error', ()=>process.exit(1))"

CMD ["node", "src/server.js"]
