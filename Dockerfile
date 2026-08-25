# =============================================================================
# Shraddha Garden — single-image build (frontend + API in one service).
# Works on Railway, Render, Fly.io, or any Docker host.
# =============================================================================
FROM node:22-slim AS build
WORKDIR /app

# Native deps needed by Prisma on slim images.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# --- frontend ---------------------------------------------------------------
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Same-origin API calls: the API serves the frontend, so no absolute URL.
RUN printf 'VITE_API_URL=\n' > .env.production && npx vite build

# --- api --------------------------------------------------------------------
WORKDIR /app/api
COPY api/package.json api/package-lock.json ./
RUN npm ci
COPY api/ ./
RUN npx prisma generate && npm run build

# =============================================================================
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV SERVE_WEB=true
ENV WEB_ROOT=/app/dist

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Built frontend
COPY --from=build /app/dist ./dist
# API (compiled output, deps, prisma schema/seeds)
COPY --from=build /app/api/dist ./api/dist
COPY --from=build /app/api/node_modules ./api/node_modules
COPY --from=build /app/api/package.json ./api/package.json
COPY --from=build /app/api/prisma ./api/prisma

WORKDIR /app/api
# SQLite lives on a mounted volume so data survives redeploys.
ENV DATABASE_URL=file:/data/prod.db
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Apply schema, seed once (only when the DB file doesn't exist yet — requires
# SEED_ADMIN_PASSWORD >= 12 chars on first boot), then serve.
CMD ["sh", "-c", "npx prisma db push --skip-generate && if [ ! -f /data/prod.db ]; then npm run seed || true; npm run seed:content || true; npm run seed:menu || true; npm run seed:addons || true; fi && node dist/src/server.js"]