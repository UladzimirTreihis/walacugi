import assert from "node:assert/strict";
import test from "node:test";
import { coerceTranslatedField } from "./coerceTranslatedField.js";

void test("coerceTranslatedField keeps strings", () => {
  assert.equal(coerceTranslatedField("Palma"), "Palma");
  assert.equal(coerceTranslatedField(""), "");
});

void test("coerceTranslatedField maps null/undefined to empty string", () => {
  assert.equal(coerceTranslatedField(null), "");
  assert.equal(coerceTranslatedField(undefined), "");
});

void test("coerceTranslatedField stringifies numbers and booleans", () => {
  assert.equal(coerceTranslatedField(7), "7");
  assert.equal(coerceTranslatedField(true), "true");
});

void test("coerceTranslatedField joins arrays", () => {
  assert.equal(coerceTranslatedField(["Palma", "Mallorca"]), "Palma, Mallorca");
  assert.equal(coerceTranslatedField([null, "Palma", ""]), "Palma");
});

void test("coerceTranslatedField prefers name-like object keys", () => {
  assert.equal(coerceTranslatedField({ name: "Palma de Mallorca", country: "Spain" }), "Palma de Mallorca");
  assert.equal(coerceTranslatedField({ city: "Palma", region: "Balearic" }), "Palma");
});

void test("coerceTranslatedField joins string object values when no name key", () => {
  assert.equal(coerceTranslatedField({ a: "one", b: "two" }), "one, two");
});
