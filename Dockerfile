# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:24-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.26.1

# Copy workspace root files (pnpm-workspace.yaml kept intact so catalog: entries survive)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Patch pnpm-workspace.yaml: keep catalog/overrides/settings but restrict
# the packages list to ONLY the game. Without this, pnpm tries to find
# lib/*, artifacts/api-server, scripts/ — none of which exist in this image.
RUN node -e "\
const fs = require('fs');\
let c = fs.readFileSync('pnpm-workspace.yaml', 'utf8');\
c = c.replace(/^packages:\\n(?:  - .*\\n)*/m, 'packages:\\n  - \"artifacts/aviator-game\"\\n');\
fs.writeFileSync('pnpm-workspace.yaml', c);\
console.log('packages section patched');\
"

# Copy only the artifact we are deploying
COPY artifacts/aviator-game/ ./artifacts/aviator-game/

# Install — frozen lockfile works because we kept the full catalog
RUN pnpm install --frozen-lockfile

# Build → output lands in artifacts/aviator-game/dist/public
ENV NODE_ENV=production
RUN pnpm --filter @workspace/aviator-game run build

# ── Stage 2: serve ────────────────────────────────────────────────────────────
FROM node:24-slim

WORKDIR /app

# serve@14 is a tiny static-file server; it reads PORT from the environment
# which Railway injects automatically at runtime
RUN npm install -g serve@14

COPY --from=builder /app/artifacts/aviator-game/dist/public ./public

EXPOSE 3000
CMD ["sh", "-c", "serve -s ./public -l ${PORT:-3000}"]
