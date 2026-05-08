import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import News from "../models/News.js";
import Event from "../models/Event.js";
import { buildApp } from "../testing/buildApp.js";
import { setupTestDb, clearTestDb, teardownTestDb } from "../testing/db.js";
import { loginAsAdmin } from "../testing/loginAsAdmin.js";

const LOCALIZED = { en: "Hello", be: "Прывітанне", pl: "Witaj" };
const EVENT_LOCALIZED = {
  title: LOCALIZED,
  description: LOCALIZED,
  location: LOCALIZED,
  approxDate: { en: "Tomorrow", be: "Заўтра", pl: "Jutro" },
  ageRestriction: { en: "18+", be: "18+", pl: "18+" }
};

before(async () => {
  await setupTestDb();
});

after(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

void test("POST /api/news without admin cookie returns 401", async () => {
  const app = buildApp({ disableRateLimiting: true, disableCsrf: true });
  const res = await request(app)
    .post("/api/news")
    .send({ title: LOCALIZED, description: LOCALIZED, location: LOCALIZED });
  assert.equal(res.status, 401);
});

void test("POST /api/news rejects payload missing localized fields with 400", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const { agent, csrfToken } = await loginAsAdmin(app);
  const res = await agent
    .post("/api/news")
    .set("X-CSRF-Token", csrfToken)
    .send({ title: "string-not-localized", description: LOCALIZED, location: LOCALIZED });
  assert.equal(res.status, 400);
  assert.match(String(res.body.error), /localized/i);
});

void test("POST /api/news creates a news item and persists it", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const { agent, csrfToken } = await loginAsAdmin(app);
  const res = await agent
    .post("/api/news")
    .set("X-CSRF-Token", csrfToken)
    .send({ title: LOCALIZED, description: LOCALIZED, location: LOCALIZED });
  assert.equal(res.status, 200);
  const stored = await News.find({});
  assert.equal(stored.length, 1);
});

void test("GET /api/news/:id returns 404 for unknown id", async () => {
  const app = buildApp({ disableRateLimiting: true, disableCsrf: true });
  const res = await request(app).get("/api/news/507f1f77bcf86cd799439011");
  assert.equal(res.status, 404);
  assert.equal(res.body.error, "Not found");
});

void test("DELETE /api/news/:id requires auth and removes the item", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const { agent, csrfToken } = await loginAsAdmin(app);
  const created = await agent
    .post("/api/news")
    .set("X-CSRF-Token", csrfToken)
    .send({ title: LOCALIZED, description: LOCALIZED, location: LOCALIZED });
  const id = created.body._id as string;
  const res = await agent
    .delete(`/api/news/${id}`)
    .set("X-CSRF-Token", csrfToken)
    .send();
  assert.equal(res.status, 200);
  const remaining = await News.find({});
  assert.equal(remaining.length, 0);
});

void test("POST /api/events rejects missing localized fields with 400", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const { agent, csrfToken } = await loginAsAdmin(app);
  const res = await agent
    .post("/api/events")
    .set("X-CSRF-Token", csrfToken)
    .send({ title: LOCALIZED });
  assert.equal(res.status, 400);
  assert.match(String(res.body.error), /localized/i);
});

void test("POST /api/events creates an event and is fetchable by id", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const { agent, csrfToken } = await loginAsAdmin(app);
  const created = await agent
    .post("/api/events")
    .set("X-CSRF-Token", csrfToken)
    .send(EVENT_LOCALIZED);
  assert.equal(created.status, 200);
  const id = created.body._id as string;
  const fetched = await agent.get(`/api/events/${id}`);
  assert.equal(fetched.status, 200);
  assert.equal(fetched.body.title, LOCALIZED.be);
  const stored = await Event.find({});
  assert.equal(stored.length, 1);
});
