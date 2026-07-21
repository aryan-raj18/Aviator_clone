# Railway Deployment Guide

This repo deploys as a **single Railway service** — the Express API server also serves
the Aviator Game frontend as static files. One Dockerfile, one service to configure.

---

## Deploy in 3 steps

### Step 1 — Connect the repo

1. Open [Railway](https://railway.app) → **New Project**
2. Click **Deploy from GitHub repo** → select this repo
3. Railway auto-detects `railway.toml` and uses `Dockerfile` — no extra config needed

### Step 2 — Set environment variables

In the service's **Variables** tab, add:

| Variable | Required? | Description |
|---|---|---|
| `DATABASE_URL` | Only if you use the DB | Postgres connection string. Railway can provision one: **+ New → Database → PostgreSQL**, then link it. |
| `PORT` | No | Auto-injected by Railway |

> The server starts and serves the game without `DATABASE_URL`. You only need it once
> you add routes that query the database.

### Step 3 — Deploy

Click **Deploy**. Railway builds the Dockerfile (builds frontend + API, runs the server).
The game will be live at your Railway service URL.

---

## How it works

```
Dockerfile (multi-stage)
  Stage 1 → builds React/Vite frontend  →  dist/public/
  Stage 2 → builds Express API server   →  dist/index.mjs
  Stage 3 → copies both, runs Express

Express (runtime)
  /api/*   →  API routes
  /*       →  serves React SPA (index.html fallback for client-side routing)
```

---

## Other Dockerfiles (advanced / separate-service setup)

The repo also contains individual Dockerfiles if you prefer to run services separately:

| File | What it deploys |
|---|---|
| `artifacts/api-server/Dockerfile` | API server only |
| `artifacts/mockup-sandbox/Dockerfile` | Component preview tool |

For separate services, create additional Railway services pointing to those Dockerfiles
and set `DATABASE_URL` on the API server service.

---

## Local development

```bash
pnpm install
pnpm --filter @workspace/api-server run dev   # API on :8080
pnpm --filter @workspace/aviator-game run dev  # Game on :21308
```
