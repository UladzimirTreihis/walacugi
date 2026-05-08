import test from "node:test";
import assert from "node:assert/strict";
import { CSRF_COOKIE_NAME, doubleCsrfProtection, generateCsrfToken } from "./csrf.js";

void test("csrf module exports the configured surface", () => {
  assert.equal(CSRF_COOKIE_NAME, "csrf_token");
  assert.equal(typeof doubleCsrfProtection, "function");
  assert.equal(typeof generateCsrfToken, "function");
});
