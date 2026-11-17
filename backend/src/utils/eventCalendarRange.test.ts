import assert from "node:assert/strict";
import test from "node:test";
import { getEventCalendarRange } from "./eventCalendarRange.js";

void test("confirmed range uses inclusive start–end", () => {
  const range = getEventCalendarRange({
    startDate: "2027-04-10",
    endDate: "2027-04-12"
  });
  assert.ok(range);
  assert.equal(range.kind, "confirmed");
  assert.deepEqual(range.days, ["2027-04-10", "2027-04-11", "2027-04-12"]);
  assert.equal(range.anchor, "2027-04-10");
});

void test("uncertain uses datedAt ±2 days when start/end incomplete", () => {
  const range = getEventCalendarRange({ datedAt: "2027-01-26" });
  assert.ok(range);
  assert.equal(range.kind, "uncertain");
  assert.equal(range.anchor, "2027-01-26");
  assert.deepEqual(range.days, [
    "2027-01-24",
    "2027-01-25",
    "2027-01-26",
    "2027-01-27",
    "2027-01-28"
  ]);
});

void test("uncertain prefers startDate when end missing", () => {
  const range = getEventCalendarRange({ startDate: "2027-06-01", datedAt: "2027-05-01" });
  assert.ok(range);
  assert.equal(range.kind, "uncertain");
  assert.equal(range.anchor, "2027-06-01");
});

void test("no ISO dates returns null", () => {
  assert.equal(getEventCalendarRange({}), null);
});
