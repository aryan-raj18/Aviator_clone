# Combined: Aviator Game (frontend) + API Server — one container, one Railway service.
#
# The API server (Express) serves the built React app as static files and
# handles /api/* routes. PORT is auto-injected by Railway at runtime.

# ── Stage 1: build frontend ────────────────────────────────────────────────────
FROM node:24-slim AS frontend-builder

WORKDIR /app

RUN npm install -g pnpm@10.26.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Restrict workspace to only the frontend so pnpm doesn't look for missing packages.
RUN node -e "\
const fs = require('fs');\
let c = fs.readFileSync('pnpm-workspace.yaml', 'utf8');\
c = c.replace(/^packages:\n(?:  - .*\n)*/m, 'packages:\n  - \"artifacts/aviator-game\"\n');\
fs.writeFileSync('pnpm-workspace.yaml', c);\
"

COPY artifacts/aviator-game/ ./artifacts/aviator-game/

RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production
RUN pnpm --filter @workspace/aviator-game run build

# ── Stage 2: build API server ──────────────────────────────────────────────────
FROM node:24-slim AS api-builder

WORKDIR /app

RUN npm install -g pnpm@10.26.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Restrict workspace to api-server + the lib packages it depends on.
RUN node -e "\
const fs = require('fs');\
let c = fs.readFileSync('pnpm-workspace.yaml', 'utf8');\
c = c.replace(/^packages:\n(?:  - .*\n)*/m,\
  'packages:\n  - \"artifacts/api-server\"\n  - \"lib/api-zod\"\n  - \"lib/db\"\n');\
fs.writeFileSync('pnpm-workspace.yaml', c);\
"

COPY lib/api-zod/ ./lib/api-zod/
COPY lib/db/      ./lib/db/
COPY artifacts/api-server/ ./artifacts/api-server/

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @workspace/api-server run build

# ── Stage 3: run ───────────────────────────────────────────────────────────────
FROM node:24-slim

WORKDIR /app

# Preserve the exact build path so pino worker file references resolve correctly.
# esbuild-plugin-pino bakes the absolute build-time path into the worker require()
# call; if we flatten the dir the worker can't be found at runtime.
COPY --from=api-builder  /app/artifacts/api-server/dist/ ./artifacts/api-server/dist/

# Frontend static files served by Express
COPY --from=frontend-builder /app/artifacts/aviator-game/dist/public/ ./public/

EXPOSE 3000
CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
