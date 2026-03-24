# Walacugi

Frontend + backend monorepo:

- `frontend`: React app (Create React App), runs on `http://localhost:3000`
- `backend`: Express API, runs on `http://localhost:4000`
- MongoDB: runs in Docker as part of backend compose stack

## Prerequisites

- Node.js 18+
- npm
- Docker + Docker Compose plugin

## 1) Backend env setup

Create backend env file from the example:

```bash
cd backend
cp env.example .env
```

Important:

- In Docker mode, `MONGO_URL` must use host `mongo` (service name), not `localhost`.
- Set real values for `JWT_SECRET` and `ADMIN_PASSWORD_HASH`.
- If you use upload endpoints, also set AWS variables.

## 2) Start backend + MongoDB with Docker

From `backend/`:

```bash
docker compose up --build
```

This starts:

- `mongo` service on port `27017`
- `app` service (backend) on port `4000`

To stop:

```bash
docker compose down
```

## 3) Frontend env setup

Create `frontend/.env` with:

```env
REACT_APP_API_URL=http://localhost:4000/api
```

## 4) Start frontend (npm)

From `frontend/`:

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Useful commands

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
