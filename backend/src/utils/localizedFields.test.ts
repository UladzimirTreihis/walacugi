import test from "node:test";
import assert from "node:assert/strict";
import type { Request } from "express";
import {
  getRequestedLang,
  getLocalizedText,
  isLocalizedText,
  normalizeLang
} from "./localizedFields.js";

function buildRequest(query: Record<string, unknown>): Request {
  return { query } as unknown as Request;
}

void test("normalizeLang accepts supported language codes", () => {
  assert.equal(normalizeLang("en"), "en");
  assert.equal(normalizeLang("BE"), "be");
  assert.equal(normalizeLang("pl-PL"), "pl");
});

void test("normalizeLang rejects unsupported or invalid input", () => {
  assert.equal(normalizeLang("fr"), null);
  assert.equal(normalizeLang(""), null);
  assert.equal(normalizeLang(null), null);
  assert.equal(normalizeLang(undefined), null);
  assert.equal(normalizeLang(42), null);
});

void test("getRequestedLang prefers query.lang and falls back to be", () => {
  assert.equal(getRequestedLang(buildRequest({ lang: "en" })), "en");
  assert.equal(getRequestedLang(buildRequest({ lang: "xx" })), "be");
  assert.equal(getRequestedLang(buildRequest({})), "be");
});

void test("isLocalizedText narrows to objects with all supported languages", () => {
  const valid = { en: "a", be: "b", pl: "c" };
  assert.equal(isLocalizedText(valid), true);
  assert.equal(isLocalizedText({ en: "only" }), false);
  assert.equal(isLocalizedText("string"), false);
  assert.equal(isLocalizedText(null), false);
  assert.equal(isLocalizedText(undefined), false);
});

void test("getLocalizedText reads the requested language", () => {
  const value = { en: "hello", be: "прывітанне", pl: "cześć" };
  assert.equal(getLocalizedText(value, "en"), "hello");
  assert.equal(getLocalizedText(value, "be"), "прывітанне");
  assert.equal(getLocalizedText(value, "pl"), "cześć");
});
