import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { buildApp } from "../testing/buildApp.js";
import { setupTestDb, clearTestDb, teardownTestDb } from "../testing/db.js";

before(async () => {
  await setupTestDb();
});

after(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

void test("error responses never expose internal stack traces", async () => {
  const app = buildApp({ disableRateLimiting: true, disableCsrf: true });
  const res = await request(app).get("/api/news/not-a-valid-objectid");
  assert.notEqual(res.status, 200);
  assert.equal(typeof res.body.stack, "undefined");
  assert.equal(typeof res.body.error, "string");
  assert.equal(res.body.error.toLowerCase().includes("cast to objectid failed"), false);
  assert.equal(res.body.error.toLowerCase().includes("mongoose"), false);
});

void test("error responses include x-request-id header for correlation", async () => {
  const app = buildApp({ disableRateLimiting: true, disableCsrf: true });
  const res = await request(app).get("/api/news/507f1f77bcf86cd799439011");
  assert.equal(res.status, 404);
  assert.equal(typeof res.headers["x-request-id"], "string");
  assert.ok((res.headers["x-request-id"] as string).length > 0);
});
