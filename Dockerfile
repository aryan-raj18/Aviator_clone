# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:24-slim AS builder

WORKDIR /app

# Enable corepack so pnpm is available without a separate install step
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

# Copy workspace-level files needed for pnpm to resolve the monorepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.json tsconfig.base.json ./

# Copy only the artifact we are deploying (no other artifacts needed)
COPY artifacts/aviator-game/ ./artifacts/aviator-game/

# Install dependencies (frozen so the build is reproducible)
RUN pnpm install --frozen-lockfile

# Build → output lands in artifacts/aviator-game/dist/public
ENV NODE_ENV=production
RUN pnpm --filter @workspace/aviator-game run build

# ── Stage 2: serve ────────────────────────────────────────────────────────────
FROM node:24-slim

WORKDIR /app

# `serve` is a tiny static-file server that honours the PORT env var Railway injects
RUN npm install -g serve@14

# Copy only the compiled static assets from the builder stage
COPY --from=builder /app/artifacts/aviator-game/dist/public ./public

# Railway injects PORT at runtime; serve reads it automatically
EXPOSE 3000
CMD ["sh", "-c", "serve -s ./public -l ${PORT:-3000}"]
