import assert from "node:assert/strict";
import test from "node:test";
import { parseEventPaste } from "./parseEventPaste.js";

const SAMPLE = `WALACUGI_EVENT_V1
title.be: Загаловак
title.en: Title
title.pl: Tytuł
location.be: Іспанія
location.en: Spain
location.pl: Hiszpania
description.be<<
<p>Апісанне</p>
>>
description.en<<
<p>Description</p>
>>
description.pl<<
<p>Opis</p>
>>
approxDate.be:
approxDate.en:
approxDate.pl:
ageRestriction.be: 10+
ageRestriction.en: 10+
ageRestriction.pl: 10+
budget: 490
currency: EUR
startDate: 2027-04-10
endDate: 2027-04-17
datedAt: 2027-04-10
countries: es
chatLink:
difficultyLevel: 3
pinned: false
`;

void test("parseEventPaste accepts a valid single event", () => {
  const result = parseEventPaste(SAMPLE);
  assert.equal(result.errors.length, 0);
  assert.equal(result.events.length, 1);
  const event = result.events[0];
  assert.equal(event.title.be, "Загаловак");
  assert.equal(event.description.en, "<p>Description</p>");
  assert.equal(event.budget, "490");
  assert.equal(event.currency, "EUR");
  assert.equal(event.startDate, "2027-04-10");
  assert.deepEqual(event.countries, ["es"]);
  assert.equal(event.difficultyLevel, 3);
  assert.equal(event.pinned, false);
  assert.deepEqual(event.images, []);
});

void test("parseEventPaste accepts multiple events", () => {
  const result = parseEventPaste(`${SAMPLE}\n${SAMPLE.replace("Загаловак", "Другі")}`);
  assert.equal(result.errors.length, 0);
  assert.equal(result.events.length, 2);
  assert.equal(result.events[1].title.be, "Другі");
});

void test("parseEventPaste requires header", () => {
  const result = parseEventPaste("title.be: x");
  assert.equal(result.events.length, 0);
  assert.match(result.errors[0].message, /Missing header/);
});

void test("parseEventPaste requires startDate or datedAt", () => {
  const bad = SAMPLE.replace("startDate: 2027-04-10", "startDate:").replace(
    "datedAt: 2027-04-10",
    "datedAt:"
  );
  const result = parseEventPaste(bad);
  assert.equal(result.events.length, 0);
  assert.match(result.errors[0].message, /startDate or datedAt/);
});

void test("parseEventPaste rejects bad difficulty", () => {
  const bad = SAMPLE.replace("difficultyLevel: 3", "difficultyLevel: 9");
  const result = parseEventPaste(bad);
  assert.equal(result.events.length, 0);
  assert.match(result.errors[0].message, /difficultyLevel/);
});

void test("parseEventPaste rejects unknown keys", () => {
  const bad = SAMPLE.replace("pinned: false", "pinned: false\nfoo: bar");
  const result = parseEventPaste(bad);
  assert.equal(result.events.length, 0);
  assert.match(result.errors[0].message, /Unknown key/);
});
