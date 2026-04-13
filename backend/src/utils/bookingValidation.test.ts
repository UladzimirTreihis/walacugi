import test from "node:test";
import assert from "node:assert/strict";
import { isValidDateRange, rangesOverlap } from "./bookingValidation.js";

test("isValidDateRange validates start before end", () => {
  const start = new Date("2026-05-01");
  const end = new Date("2026-05-03");
  assert.equal(isValidDateRange(start, end), true);
  assert.equal(isValidDateRange(end, start), false);
});

test("rangesOverlap detects conflict", () => {
  const a = { startDate: new Date("2026-05-01"), endDate: new Date("2026-05-05") };
  const b = { startDate: new Date("2026-05-04"), endDate: new Date("2026-05-06") };
  const c = { startDate: new Date("2026-05-05"), endDate: new Date("2026-05-07") };
  assert.equal(rangesOverlap(a, b), true);
  assert.equal(rangesOverlap(a, c), false);
});
