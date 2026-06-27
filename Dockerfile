# Coolify: Medusa backend only (Postgres + Redis are external services).
#
# Coolify settings:
#   Base directory: / (repo root)
#   Dockerfile location: Dockerfile
#   Port: 9000

ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-bookworm-slim AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends tini=0.19.0-1+b3 curl \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --frozen-lockfile --filter @dtc/backend...

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend ./apps/backend

ENV NODE_ENV=production
RUN pnpm --filter @dtc/backend build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=9000
ENV MEDUSA_RUN_MIGRATION=true

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/backend ./apps/backend

RUN chmod +x /app/apps/backend/start.sh

USER node
WORKDIR /app/apps/backend

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health" || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["./start.sh"]
