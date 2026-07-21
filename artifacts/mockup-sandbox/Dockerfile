# Build context is the repository root (Railway always uses repo root for Docker builds).
# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:24-slim AS builder

WORKDIR /app

RUN npm install -g pnpm@10.26.1

# Workspace root files needed for pnpm workspace + lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Restrict workspace to only mockup-sandbox so pnpm doesn't look for
# lib/*, api-server, etc. which don't exist in this image.
RUN node -e "\
const fs = require('fs');\
let c = fs.readFileSync('pnpm-workspace.yaml', 'utf8');\
c = c.replace(/^packages:\\n(?:  - .*\\n)*/m, 'packages:\\n  - \"artifacts/mockup-sandbox\"\\n');\
fs.writeFileSync('pnpm-workspace.yaml', c);\
"

COPY artifacts/mockup-sandbox/ ./artifacts/mockup-sandbox/

RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production
RUN pnpm --filter @workspace/mockup-sandbox run build

# ── Stage 2: serve ────────────────────────────────────────────────────────────
FROM node:24-slim

WORKDIR /app

COPY --from=builder /app/artifacts/mockup-sandbox/dist/ ./public/
# server.mjs: pure-Node SPA server — avoids Express 5 path-to-regexp '*' issue
COPY artifacts/mockup-sandbox/server.mjs ./

EXPOSE 3000
CMD ["node", "server.mjs"]
