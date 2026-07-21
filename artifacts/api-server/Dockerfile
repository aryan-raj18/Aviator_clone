# Build context is the repository root (Railway always uses repo root for Docker builds).
# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:24-slim AS builder

WORKDIR /app

RUN npm install -g pnpm@10.26.1

# Workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Restrict workspace to api-server + the two lib packages it depends on.
RUN node -e "\
const fs = require('fs');\
let c = fs.readFileSync('pnpm-workspace.yaml', 'utf8');\
c = c.replace(/^packages:\\n(?:  - .*\\n)*/m,\
  'packages:\\n  - \"artifacts/api-server\"\\n  - \"lib/api-zod\"\\n  - \"lib/db\"\\n');\
fs.writeFileSync('pnpm-workspace.yaml', c);\
"

# lib sources are bundled by esbuild into the final dist
COPY lib/api-zod/ ./lib/api-zod/
COPY lib/db/      ./lib/db/

COPY artifacts/api-server/ ./artifacts/api-server/

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @workspace/api-server run build

# ── Stage 2: run ──────────────────────────────────────────────────────────────
FROM node:24-slim

WORKDIR /app

# esbuild bundles everything — no node_modules needed at runtime
COPY --from=builder /app/artifacts/api-server/dist/ ./dist/

EXPOSE 3000
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
