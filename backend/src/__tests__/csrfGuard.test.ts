import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import News from "../models/News.js";
import { buildApp } from "../testing/buildApp.js";
import { setupTestDb, clearTestDb, teardownTestDb } from "../testing/db.js";
import { loginAsAdmin } from "../testing/loginAsAdmin.js";

const LOCALIZED = { en: "Title", be: "Загаловак", pl: "Tytuł" };

before(async () => {
  await setupTestDb();
});

after(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

void test("mutating route without CSRF cookie returns 403", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const res = await request(app)
    .post("/api/news")
    .send({ title: LOCALIZED, description: LOCALIZED, location: LOCALIZED });
  assert.equal(res.status, 403);
});

void test("mutating route with valid CSRF token and auth cookie passes the guard", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const { agent, csrfToken } = await loginAsAdmin(app);
  const res = await agent
    .post("/api/news")
    .set("X-CSRF-Token", csrfToken)
    .send({ title: LOCALIZED, description: LOCALIZED, location: LOCALIZED });
  assert.equal(res.status, 200);
  const created = await News.findOne({});
  assert.ok(created);
});

void test("mutating route with valid auth cookie but missing CSRF header returns 403", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const { agent } = await loginAsAdmin(app);
  const res = await agent
    .post("/api/news")
    .send({ title: LOCALIZED, description: LOCALIZED, location: LOCALIZED });
  assert.equal(res.status, 403);
});

void test("GET requests are not subject to CSRF", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const res = await request(app).get("/api/news");
  assert.equal(res.status, 200);
});
