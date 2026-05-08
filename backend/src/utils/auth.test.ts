import test from "node:test";
import assert from "node:assert/strict";
import type { Response } from "express";
import {
  AUTH_TOKEN_COOKIE_NAME,
  authCookieOptions,
  clearAuthCookie,
  cookieSameSite,
  isCookieSecure,
  setAuthCookie
} from "./auth.js";

interface CookieCall {
  name: string;
  value: string | null;
  options: Record<string, unknown>;
}

function buildMockResponse(): { res: Response; calls: CookieCall[] } {
  const calls: CookieCall[] = [];
  const res = {
    cookie: (name: string, value: string, options: Record<string, unknown>) => {
      calls.push({ name, value, options });
    },
    clearCookie: (name: string, options: Record<string, unknown>) => {
      calls.push({ name, value: null, options });
    }
  } as unknown as Response;
  return { res, calls };
}

void test("authCookieOptions sets httpOnly, path, and 1-day maxAge", () => {
  const opts = authCookieOptions();
  assert.equal(opts.httpOnly, true);
  assert.equal(opts.path, "/");
  assert.equal(opts.maxAge, 24 * 60 * 60 * 1000);
});

void test("isCookieSecure and cookieSameSite track NODE_ENV", () => {
  const original = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    assert.equal(isCookieSecure(), true);
    assert.equal(cookieSameSite(), "none");
    process.env.NODE_ENV = "development";
    assert.equal(isCookieSecure(), false);
    assert.equal(cookieSameSite(), "lax");
  } finally {
    process.env.NODE_ENV = original;
  }
});

void test("setAuthCookie writes the configured options", () => {
  const { res, calls } = buildMockResponse();
  setAuthCookie(res, "abc.def.ghi");
  assert.equal(calls.length, 1);
  const [{ name, value, options }] = calls;
  assert.equal(name, AUTH_TOKEN_COOKIE_NAME);
  assert.equal(value, "abc.def.ghi");
  assert.equal(options.httpOnly, true);
  assert.equal(options.path, "/");
  assert.equal(options.secure, isCookieSecure());
  assert.equal(options.sameSite, cookieSameSite());
});

void test("clearAuthCookie clears with matching flags", () => {
  const { res, calls } = buildMockResponse();
  clearAuthCookie(res);
  assert.equal(calls.length, 1);
  const [{ name, value, options }] = calls;
  assert.equal(name, AUTH_TOKEN_COOKIE_NAME);
  assert.equal(value, null);
  assert.equal(options.httpOnly, true);
  assert.equal(options.path, "/");
});
