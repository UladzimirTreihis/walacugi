# Walacugi

Public-facing site and admin tooling for **news, events, equipment catalog, reservations, and multilingual content** — a full-stack TypeScript monorepo with a React SPA and an Express API backed by MongoDB.

---

## Overview

Walacugi is a production-style web application: visitors browse localized content and interact with booking flows; authenticated admins manage entities through protected APIs with CSRF-aware mutations, uploads, and optional AI-assisted translation.

**Live site:** [walacugi.org](https://walacugi.org/)

### Tech stack

| Layer | Choices |
| --- | --- |
| **Frontend** | React 18, TypeScript, Material UI, Redux Toolkit, React Router, i18next, Create React App |
| **Backend** | Node.js, Express, TypeScript (ESM), Mongoose |
| **Data** | MongoDB |
| **Infra & tooling** | Docker / Docker Compose (API + DB), structured logging (Pino), ESLint + Prettier, GitHub Actions (lint + typecheck) |
| **Integrations** | AWS S3 (uploads), OpenAI API (admin translation helper), bcrypt + JWT (sessions) |

### What it does

- **Public API:** News, events, equipment listings, reservations, and file uploads exposed under REST-style routes with CORS tuned for separate frontend hosting.
- **Admin:** Password login with HttpOnly JWT cookie, CSRF double-submit on mutating routes, rate limiting on sensitive endpoints, CRUD for news/events/equipment/categories, rich content concerns (images, localized fields).
- **Internationalization:** Locale-aware content model and UI strings (e.g. URL language segments with `react-i18next`).
- **Deployment-shaped concerns:** Environment-driven secrets (`JWT_SECRET`, `COOKIE_SECRET`, `CSRF_SECRET`), comma-separated `CORS_ORIGINS`, and cookie `SameSite` / `Secure` behavior aligned with HTTPS production vs local HTTP.

### Technical challenges & decisions

- **Split composition vs. bootstrapping:** Express middleware and routes live in a shared `buildApp()` factory so the same stack can be exercised with Supertest in-process while `server.ts` only wires MongoDB, listening, and process-level error hooks — avoiding duplicate route definitions and flaky port-based tests.
- **Cross-origin admin SPA:** With frontend and API on different origins, credentialed requests require explicit CORS allowlists, correct cookie attributes in production (`SameSite=None; Secure`), and CSRF tokens that travel both as cookies and headers.
- **Consistency under concurrency:** API tests run with Node’s test runner and `mongodb-memory-server`, using shared DB setup with serialized concurrency where shared global state (mongoose, limiters) would otherwise flake.
- **Operational clarity:** Centralized HTTP errors, async route wrapping, and request logging keep behavior observable without scattering ad hoc `console` usage.

---

## For collaborators

Monorepo layout:

- `frontend/` — React app (default dev URL `http://localhost:3000`).
- `backend/` — Express API (default `http://localhost:4000`).
- MongoDB runs in Docker as part of the backend Compose stack.

### Prerequisites

- **Node.js 20+** and npm (aligned with CI and the backend Docker image).
- Docker and the Docker Compose plugin (for the recommended backend + DB workflow).

### 1) Backend environment

From `backend/`:

```bash
cp env.example .env
```

Edit `.env` with real values. Important points:

- **Docker Compose:** `MONGO_URL` must use hostname **`mongo`** (the Compose service name), not `localhost`.
- **Secrets:** Set strong, distinct values for `JWT_SECRET`, `COOKIE_SECRET`, and `CSRF_SECRET` (see comments in `env.example`).
- **Admin access:** Set `ADMIN_PASSWORD_HASH` (bcrypt). Helper from repo root: `bash scripts/update-admin-password.sh`.
- **Uploads:** Configure AWS variables when using S3-backed upload routes.
- **Production frontend:** Set `CORS_ORIGINS` to comma-separated origins (scheme + host + port only, no path — e.g. `https://walacugi.org`). Include Netlify preview URLs only if traffic actually loads from those hosts.

### 2) Start backend + MongoDB (Docker)

From `backend/`:

```bash
docker compose up --build
```

This starts MongoDB (e.g. port **27017**) and the API (port **4000**). Stop with:

```bash
docker compose down
```

### 3) Frontend environment

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:4000/api
```

Point this at your deployed API URL when building for production.

### 4) Run the frontend locally

From `frontend/`:

```bash
npm install
npm start
```

Open `http://localhost:3000`.

### Backend tests

API and utility tests use Node’s built-in test runner and compiled TypeScript output. See **[backend/TESTING.md](backend/TESTING.md)** for commands (`npm test`), preload behavior, and DB helpers.

### Useful commands

Backend logs:

```bash
cd backend
docker compose logs -f app
```

Mongo logs:

```bash
cd backend
docker compose logs -f mongo
```

Update admin password hash in `.env` and recreate containers:

```bash
# From repo root
bash scripts/update-admin-password.sh
cd backend && docker compose down && docker compose up -d --build
```
