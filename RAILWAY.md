# Railway Deployment Guide

This repo has **3 deployable services**. Each has its own Dockerfile at the root.

| Service | Dockerfile | What it is |
|---|---|---|
| Aviator Game | `Dockerfile` | The game frontend (React) |
| API Server | `Dockerfile.api-server` | The backend Express API |
| Mockup Sandbox | `Dockerfile.mockup-sandbox` | Component preview tool |

---

## Step 1 — Connect the repo (first time only)

1. Open [Railway](https://railway.app) → **New Project**
2. Click **Deploy from GitHub repo** → select this repo
3. Railway creates the **Aviator Game** service automatically (it reads `railway.toml` + `Dockerfile`)

---

## Step 2 — Add the API Server service

1. In your Railway project, click **+ New** → **GitHub Repo** → same repo
2. Railway shows a settings panel — click **Configure**
3. Set **Dockerfile Path** → `Dockerfile.api-server`
4. Click **Deploy**

> **Required env var:** Add `DATABASE_URL` in the service's **Variables** tab (your Postgres connection string).

---

## Step 3 — Add the Mockup Sandbox service

1. Click **+ New** → **GitHub Repo** → same repo again
2. Set **Dockerfile Path** → `Dockerfile.mockup-sandbox`
3. Click **Deploy**

---

## Step 4 — Remove the broken auto-detected services

Railway may have auto-created services named `@workspace/api-spec` and `@workspace/api-client`.  
These are internal library packages — **not deployable**. Delete them:

1. Click the service → **Settings** → scroll to bottom → **Delete Service**

---

## Environment Variables

| Service | Variable | Required? | Description |
|---|---|---|---|
| API Server | `DATABASE_URL` | Yes | Postgres connection string |
| API Server | `PORT` | No | Auto-injected by Railway |
| Aviator Game | `PORT` | No | Auto-injected by Railway |
| Mockup Sandbox | `PORT` | No | Auto-injected by Railway |

All services read `PORT` automatically from Railway — no manual setting needed.
