import test from "node:test";
import assert from "node:assert/strict";
import { HttpError, isHttpError } from "./httpErrors.js";

void test("HttpError exposes status and publicMessage", () => {
  const err = new HttpError(404, "Not found");
  assert.equal(err.status, 404);
  assert.equal(err.publicMessage, "Not found");
  assert.equal(err.message, "Not found");
  assert.equal(err.name, "HttpError");
  assert.ok(err instanceof Error);
});

void test("HttpError preserves cause when provided", () => {
  const cause = new Error("root");
  const err = new HttpError(500, "Internal", { cause });
  assert.equal((err as { cause?: unknown }).cause, cause);
});

void test("isHttpError narrows for HttpError instances", () => {
  const err = new HttpError(400, "Bad request");
  assert.equal(isHttpError(err), true);
  assert.equal(isHttpError(new Error("plain")), false);
  assert.equal(isHttpError({ status: 400 }), false);
  assert.equal(isHttpError(null), false);
  assert.equal(isHttpError(undefined), false);
});
