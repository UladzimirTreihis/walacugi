import assert from "node:assert/strict";
import test from "node:test";
import {
  countRentalDays,
  getDailyRate,
  getLineTotal,
  getMinDailyRate,
  parsePriceTiers,
  resolvePriceBracket,
  tiersFromLegacyPricePerDay
} from "./equipmentPricing.js";

const SLEEPING_BAG = {
  d1_2: 15,
  d3_4: 10,
  d5_7: 8,
  d8_14: 7,
  d15_plus: 6
};

void test("resolvePriceBracket maps day counts to tiers", () => {
  assert.equal(resolvePriceBracket(1), "d1_2");
  assert.equal(resolvePriceBracket(2), "d1_2");
  assert.equal(resolvePriceBracket(3), "d3_4");
  assert.equal(resolvePriceBracket(7), "d5_7");
  assert.equal(resolvePriceBracket(14), "d8_14");
  assert.equal(resolvePriceBracket(15), "d15_plus");
  assert.equal(resolvePriceBracket(40), "d15_plus");
});

void test("getDailyRate and getLineTotal for sleeping bag tiers", () => {
  assert.equal(getDailyRate(SLEEPING_BAG, 2), 15);
  assert.equal(getLineTotal(SLEEPING_BAG, 2), 30);
  assert.equal(getDailyRate(SLEEPING_BAG, 5), 8);
  assert.equal(getLineTotal(SLEEPING_BAG, 5), 40);
  assert.equal(getDailyRate(SLEEPING_BAG, 20), 6);
  assert.equal(getLineTotal(SLEEPING_BAG, 20), 120);
});

void test("getMinDailyRate returns lowest tier", () => {
  assert.equal(getMinDailyRate(SLEEPING_BAG), 6);
});

void test("countRentalDays uses exclusive end", () => {
  assert.equal(countRentalDays("2027-04-10", "2027-04-12"), 2);
  assert.equal(countRentalDays("2027-04-10", "2027-04-11"), 1);
});

void test("parsePriceTiers accepts numbers and rejects negatives", () => {
  assert.deepEqual(parsePriceTiers(SLEEPING_BAG), SLEEPING_BAG);
  assert.equal(parsePriceTiers({ ...SLEEPING_BAG, d1_2: -1 }), null);
  assert.deepEqual(tiersFromLegacyPricePerDay(25), {
    d1_2: 25,
    d3_4: 25,
    d5_7: 25,
    d8_14: 25,
    d15_plus: 25
  });
});
