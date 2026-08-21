# ---------- Etapa 1: dependencias ----------
FROM node:22-alpine AS deps

WORKDIR /app

# Se copian solo los manifiestos para aprovechar la cache de capas de Docker
COPY package.json package-lock.json ./

# npm ci instala exactamente lo del lockfile; --omit=dev deja fuera jest y supertest
RUN npm ci --omit=dev && npm cache clean --force

# ---------- Etapa 2: imagen final ----------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# curl se usa en el HEALTHCHECK
RUN apk add --no-cache curl

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY public ./public

# La imagen de node ya trae el usuario "node" sin privilegios
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -fsS http://127.0.0.1:${PORT}/health || exit 1

CMD ["node", "src/server.js"]
