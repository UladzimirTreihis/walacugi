import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { buildApp, TEST_ADMIN_PASSWORD } from "../testing/buildApp.js";
import { setupTestDb, clearTestDb, teardownTestDb } from "../testing/db.js";
import { loginAsAdmin } from "../testing/loginAsAdmin.js";
import { adminLimiter, globalLimiter, loginLimiter } from "../utils/rateLimit.js";

interface ResettableLimiter {
  resetKey?: (key: string) => void;
}

function resetLimiters(): void {
  const ips = ["::ffff:127.0.0.1", "127.0.0.1", "::1"];
  for (const limiter of [adminLimiter, globalLimiter, loginLimiter]) {
    const reset = (limiter as unknown as ResettableLimiter).resetKey;
    if (typeof reset === "function") {
      ips.forEach((ip) => reset.call(limiter, ip));
    }
  }
}

before(async () => {
  await setupTestDb();
});

after(async () => {
  resetLimiters();
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  resetLimiters();
});

void test("loginLimiter blocks the 6th failed login attempt with 429", async () => {
  const app = buildApp();
  for (let i = 0; i < 5; i += 1) {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ password: "wrong-password" });
    assert.equal(res.status, 401, `attempt ${i + 1} should be 401`);
  }
  const blocked = await request(app)
    .post("/api/admin/login")
    .send({ password: "wrong-password" });
  assert.equal(blocked.status, 429);
});

void test("loginLimiter does not consume quota on successful logins", async () => {
  const app = buildApp();
  for (let i = 0; i < 6; i += 1) {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ password: TEST_ADMIN_PASSWORD });
    assert.equal(res.status, 200, `successful attempt ${i + 1} should be 200`);
  }
});

void test("admin GET routes are not subject to admin mutation limiter", async () => {
  const app = buildApp();
  const { agent } = await loginAsAdmin(app);
  for (let i = 0; i < 50; i += 1) {
    const res = await agent.get("/api/admin/me");
    assert.equal(res.status, 200, `GET /admin/me attempt ${i + 1} should be 200`);
  }
});
