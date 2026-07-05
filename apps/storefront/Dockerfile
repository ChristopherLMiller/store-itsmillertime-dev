# Coolify / Docker: Next.js storefront (Medusa backend is a separate service).
#
# Build from repo root:
#   docker build -f apps/storefront/Dockerfile \
#     --build-arg NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_... \
#     --build-arg NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.example.com \
#     --build-arg NEXT_PUBLIC_BASE_URL=https://shop.example.com \
#     --build-arg NEXT_PUBLIC_ECOMMERCE_ENVIRONMENT=sandbox \
#     --build-arg NEXT_PUBLIC_STRIPE_SANDBOX_KEY=pk_test_... \
#     -t dtc-storefront .
#
# Coolify settings:
#   Base directory: / (repo root)
#   Dockerfile location: apps/storefront/Dockerfile
#   Port: 8000
#
# NEXT_PUBLIC_* variables must be set at build time (Next.js bakes them into the bundle).

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
COPY apps/storefront/package.json ./apps/storefront/

RUN pnpm install --frozen-lockfile --filter @dtc/storefront...

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/storefront/node_modules ./apps/storefront/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/storefront ./apps/storefront

ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
ARG NEXT_PUBLIC_BASE_URL=http://localhost:8000
ARG NEXT_PUBLIC_DEFAULT_REGION=us
ARG NEXT_PUBLIC_ECOMMERCE_ENVIRONMENT=sandbox
ARG NEXT_PUBLIC_STRIPE_SANDBOX_KEY
ARG NEXT_PUBLIC_STRIPE_LIVE_KEY
ARG MEDUSA_CLOUD_S3_HOSTNAME
ARG MEDUSA_CLOUD_S3_PATHNAME

ENV NODE_ENV=production
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION
ENV NEXT_PUBLIC_ECOMMERCE_ENVIRONMENT=$NEXT_PUBLIC_ECOMMERCE_ENVIRONMENT
ENV NEXT_PUBLIC_STRIPE_SANDBOX_KEY=$NEXT_PUBLIC_STRIPE_SANDBOX_KEY
ENV NEXT_PUBLIC_STRIPE_LIVE_KEY=$NEXT_PUBLIC_STRIPE_LIVE_KEY
ENV MEDUSA_CLOUD_S3_HOSTNAME=$MEDUSA_CLOUD_S3_HOSTNAME
ENV MEDUSA_CLOUD_S3_PATHNAME=$MEDUSA_CLOUD_S3_PATHNAME

RUN pnpm --filter @dtc/storefront build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/apps/storefront/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/storefront/.next/static ./apps/storefront/.next/static
COPY --from=builder --chown=node:node /app/apps/storefront/public ./apps/storefront/public

USER node
WORKDIR /app/apps/storefront

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/" -o /dev/null || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
