import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { buildApp } from "../testing/buildApp.js";

void test("requests with no Origin header are allowed (e.g. server-to-server, curl)", async () => {
  const app = buildApp({ corsOrigins: ["https://allowed.example.com"], disableRateLimiting: true });
  const res = await request(app).get("/health");
  assert.equal(res.status, 200);
});

void test("requests from an allow-listed origin echo the origin header", async () => {
  const app = buildApp({ corsOrigins: ["https://allowed.example.com"], disableRateLimiting: true });
  const res = await request(app)
    .get("/health")
    .set("Origin", "https://allowed.example.com");
  assert.equal(res.status, 200);
  assert.equal(res.headers["access-control-allow-origin"], "https://allowed.example.com");
  assert.equal(res.headers["access-control-allow-credentials"], "true");
});

void test("requests from a disallowed origin are rejected", async () => {
  const app = buildApp({ corsOrigins: ["https://allowed.example.com"], disableRateLimiting: true });
  const res = await request(app)
    .get("/health")
    .set("Origin", "https://evil.example.com");
  assert.notEqual(res.status, 200);
  assert.notEqual(res.headers["access-control-allow-origin"], "https://evil.example.com");
});
