import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { buildApp, TEST_ADMIN_PASSWORD } from "../testing/buildApp.js";
import { setupTestDb, clearTestDb, teardownTestDb } from "../testing/db.js";
import { loginAsAdmin } from "../testing/loginAsAdmin.js";

before(async () => {
  await setupTestDb();
});

after(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

void test("POST /api/admin/login with correct password returns 200 and sets HttpOnly auth cookie", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const res = await request(app)
    .post("/api/admin/login")
    .send({ password: TEST_ADMIN_PASSWORD });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { ok: true });
  const cookies = (res.headers["set-cookie"] as unknown as string[] | string | undefined) ?? [];
  const cookieList = Array.isArray(cookies) ? cookies : [cookies];
  const authCookie = cookieList.find((cookie) => cookie.startsWith("auth_token="));
  assert.ok(authCookie, "auth_token cookie should be set");
  assert.match(authCookie, /HttpOnly/i);
});

void test("POST /api/admin/login marks cookie Secure+SameSite=None in production", async () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    const app = buildApp({ disableRateLimiting: true });
    const res = await request(app)
      .post("/api/admin/login")
      .send({ password: TEST_ADMIN_PASSWORD });
    assert.equal(res.status, 200);
    const cookies = (res.headers["set-cookie"] as unknown as string[] | string | undefined) ?? [];
    const cookieList = Array.isArray(cookies) ? cookies : [cookies];
    const authCookie = cookieList.find((cookie) => cookie.startsWith("auth_token="));
    assert.ok(authCookie);
    assert.match(authCookie, /Secure/i);
    assert.match(authCookie, /SameSite=None/i);
  } finally {
    process.env.NODE_ENV = original;
  }
});

void test("POST /api/admin/login with wrong password returns 401 without leaking details", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const res = await request(app)
    .post("/api/admin/login")
    .send({ password: "wrong-password" });
  assert.equal(res.status, 401);
  assert.equal(res.body.error, "Invalid credentials");
  assert.equal(typeof res.body.stack, "undefined");
  assert.equal(JSON.stringify(res.body).toLowerCase().includes("bcrypt"), false);
});

void test("POST /api/admin/login without password returns 500 misconfiguration message only", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const res = await request(app).post("/api/admin/login").send({});
  assert.equal(res.status, 500);
  assert.equal(res.body.error, "Server misconfiguration");
});

void test("GET /api/admin/me without cookie is 401", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const res = await request(app).get("/api/admin/me");
  assert.equal(res.status, 401);
  assert.equal(res.body.error, "Unauthorized");
});

void test("GET /api/admin/me after login returns isAdmin true", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const { agent } = await loginAsAdmin(app);
  const res = await agent.get("/api/admin/me");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { isAdmin: true });
});

void test("GET /api/admin/csrf returns a token after login", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const { csrfToken } = await loginAsAdmin(app);
  assert.equal(typeof csrfToken, "string");
  assert.ok(csrfToken.length > 0);
});

void test("POST /api/admin/logout clears auth cookie", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const { agent, csrfToken } = await loginAsAdmin(app);
  const res = await agent
    .post("/api/admin/logout")
    .set("X-CSRF-Token", csrfToken)
    .send({});
  assert.equal(res.status, 204);
  const cookies = (res.headers["set-cookie"] as unknown as string[] | string | undefined) ?? [];
  const cookieList = Array.isArray(cookies) ? cookies : [cookies];
  const cleared = cookieList.find((cookie) => cookie.startsWith("auth_token="));
  assert.ok(cleared, "auth_token Set-Cookie should be present in logout response");
  const wasClearedSomehow =
    /auth_token=;/.test(cleared) ||
    /Max-Age=0/i.test(cleared) ||
    /Expires=Thu, 01 Jan 1970/i.test(cleared);
  assert.ok(wasClearedSomehow, `auth_token cookie was not cleared: ${cleared}`);
  const followUp = await agent.get("/api/admin/me");
  assert.equal(followUp.status, 401);
});
