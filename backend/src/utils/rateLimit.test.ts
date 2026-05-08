import test from "node:test";
import assert from "node:assert/strict";
import { adminLimiter, globalLimiter, loginLimiter } from "./rateLimit.js";

void test("rate limiters are configured express middlewares", () => {
  assert.equal(typeof globalLimiter, "function");
  assert.equal(typeof adminLimiter, "function");
  assert.equal(typeof loginLimiter, "function");
});

void test("rate limiters expose a resetKey helper from express-rate-limit", () => {
  const limiter = loginLimiter as unknown as { resetKey?: (key: string) => void };
  assert.equal(typeof limiter.resetKey, "function");
});
