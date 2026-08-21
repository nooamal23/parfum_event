# syntax=docker/dockerfile:1

# ---------- Étape 1 : dépendances ----------
FROM node:26-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---------- Étape 2 : build ----------
FROM node:26-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# ---------- Étape 3 : image de production ----------
FROM node:26-alpine AS production
RUN apk update && apk upgrade --no-cache
# npm/yarn/corepack sont inutiles en production (le CMD ne lance que node) :
# on les retire pour ne pas embarquer leurs dépendances internes vulnérables
# (ex. tar, sigstore, minimatch, glob) dans l'image finale.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
  /usr/local/bin/corepack /opt/yarn-v1.22.22 /usr/local/bin/yarn /usr/local/bin/yarnpkg
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/public ./public
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static

USER appuser

EXPOSE 3000
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', r => process.exit(r.statusCode<500?0:1)).on('error', ()=>process.exit(1))"

CMD ["node", "server.js"]
