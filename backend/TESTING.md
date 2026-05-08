# Backend testing

The API uses Node’s built-in [`node:test`](https://nodejs.org/api/test.html) runner, TypeScript compiled to `dist/`, and [Supertest](https://github.com/ladjs/supertest) for HTTP assertions against an in-memory Express app.

## Prerequisites

- Node.js 20+ (aligned with CI)
- From `backend/`: `npm ci`

Integration tests rely on [`mongodb-memory-server`](https://github.com/nodkz/mongodb-memory-server), which downloads a MongoDB binary the first time it runs (needs network once).

## Commands

| Command             | Purpose |
|---------------------|---------|
| `npm test`          | Compile with `tsc`, then run all `*.test.js` files under `dist/utils/` and `dist/__tests__/`. |
| `npm run test:watch` | TypeScript `--watch` plus the test runner in `--watch` mode (two processes). |
| `npm run test:booking` | Run only `bookingValidation` tests (no full `tsc` step; compile first if sources changed). |

The main `test` script loads `dist/testing/preload.js` via `node --import` so secrets and logging are set before any test file runs. `--test-concurrency=1` keeps a single worker so shared resources (mongoose, in-memory MongoDB, rate-limit state) stay predictable.

## Layout

| Path | Role |
|------|------|
| `src/testing/preload.ts` | Injected before tests: forces `NODE_ENV=test`, silent logs, deterministic JWT/CSRF/cookie secrets, bcrypt `ADMIN_PASSWORD_HASH`, dummy AWS vars, etc. |
| `src/testing/buildApp.ts` | Builds the Express app (routes, CORS, CSRF, rate limits) **without** calling `listen()`. Exported `TEST_ADMIN_PASSWORD` matches the hashed admin password from preload. |
| `src/testing/db.ts` | `setupTestDb()` starts one shared MongoDB Memory Server and connects mongoose; `clearTestDb()` drops all collections (use in `beforeEach`); `teardownTestDb()` disconnects and stops mongod. |
| `src/testing/loginAsAdmin.ts` | Logs in via `/api/admin/login`, fetches `/api/admin/csrf`, returns a Supertest agent with cookies plus the `X-CSRF-Token` header value for mutations. |
| `src/__tests__/*.test.ts` | HTTP-level integration tests (auth, CRUD, CORS, uploads, etc.). |
| `src/utils/*.test.ts` | Focused unit tests (e.g. CSRF helpers, validators). |

Co-located `*.test.ts` files compile next to their modules under `dist/`.

## Typical integration pattern

1. **`before`**: `await setupTestDb()` once per file (or suite).
2. **`beforeEach`**: `await clearTestDb()` for isolation.
3. **`after`**: `await teardownTestDb()` when you want a clean shutdown (optional with `--test-force-exit`; memory server hooks still clean up on exit).

Build the app with options that match what you’re testing, for example:

```ts
const app = buildApp({
  disableRateLimiting: true, // avoids shared limiter noise unless the test targets rate limiting
  disableCsrf: true,          // skip CSRF unless the test targets it
});
```

Use `loginAsAdmin(app)` when you need authenticated admin + CSRF for mutating routes.

## Local MongoDB (non-test runs)

Automated tests do **not** require a running Docker MongoDB. For developing or debugging against a real database, see `docs/MONGO_LOCAL_GUIDE.md`.

## CI

`.github/workflows/standards.yml` runs `npm run lint` and `npm run typecheck` in `backend/`; extend the job with `npm test` when you want tests in every PR.
