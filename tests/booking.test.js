const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validDate,
  validTime,
  weekday,
  toUtcDate,
  slotWithinSchedule,
} = require("../src/utils/booking");

test("validates ISO calendar date including leap days", () => {
  assert.equal(validDate("2026-02-29"), false);
  assert.equal(validDate("2028-02-29"), true);
  assert.equal(validDate("2026-11-31"), false);
});
test("accepts only HH:00 or HH:30 appointment start", () => {
  assert.equal(validTime("10:00"), true);
  assert.equal(validTime("10:30"), true);
  assert.equal(validTime("10:15"), false);
  assert.equal(validTime("25:00"), false);
});
test("weekday Sunday=0 and Istanbul UTC+03 offset", () => {
  assert.equal(weekday("2026-10-19"), 1);
  assert.equal(
    toUtcDate("2026-10-19", "10:00").toISOString(),
    "2026-10-19T07:00:00.000Z",
  );
});
test("30-minute appointment fits entirely inside schedule", () => {
  const s = { start_time: "09:00:00", end_time: "17:00:00" };
  assert.equal(slotWithinSchedule("09:00", s), true);
  assert.equal(slotWithinSchedule("16:30", s), true);
  assert.equal(slotWithinSchedule("17:00", s), false);
  assert.equal(slotWithinSchedule("08:30", s), false);
});
