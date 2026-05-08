import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import { errorHandler } from "./errorHandler.js";
import { HttpError } from "./httpErrors.js";

function buildApp() {
  const app = express();
  app.get("/http-error", () => {
    throw new HttpError(400, "Bad input");
  });
  app.get("/internal", () => {
    throw new Error("DB password leaked: hunter2");
  });
  app.get("/with-status", (_req, _res, next) => {
    const err: Error & { status?: number } = new Error("With status");
    err.status = 418;
    next(err);
  });
  app.use(errorHandler);
  return app;
}

void test("errorHandler returns publicMessage for HttpError", async () => {
  const res = await request(buildApp()).get("/http-error");
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Bad input");
  assert.equal(typeof res.body.error, "string");
});

void test("errorHandler hides internal error message and stack", async () => {
  const res = await request(buildApp()).get("/internal");
  assert.equal(res.status, 500);
  assert.equal(res.body.error, "Internal server error");
  assert.equal(typeof res.body.stack, "undefined");
  assert.equal(JSON.stringify(res.body).includes("hunter2"), false);
});

void test("errorHandler honors numeric status on plain errors", async () => {
  const res = await request(buildApp()).get("/with-status");
  assert.equal(res.status, 418);
  assert.equal(res.body.error, "Internal server error");
});
