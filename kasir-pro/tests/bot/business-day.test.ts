import assert from "node:assert/strict";
import test from "node:test";
import {
  getBusinessDayContext,
  resolveBusinessRange,
} from "@/lib/business-day";

const settings = {
  timezone: "Asia/Jakarta",
  closingTimeLocal: "22:00",
};

test("business day before closing uses previous closing boundary", () => {
  const now = new Date("2026-07-05T14:59:00.000Z");
  const context = getBusinessDayContext(now, settings);

  assert.equal(context.latestBoundaryDate, "2026-07-04");
  assert.equal(context.completedWindow.labelDate, "2026-07-04");
  assert.equal(context.activeWindow.labelDate, "2026-07-05");
});

test("business day after closing advances to current closing boundary", () => {
  const now = new Date("2026-07-05T15:01:00.000Z");
  const context = getBusinessDayContext(now, settings);

  assert.equal(context.latestBoundaryDate, "2026-07-05");
  assert.equal(context.completedWindow.labelDate, "2026-07-05");
  assert.equal(context.activeWindow.labelDate, "2026-07-06");
});

test("today range starts from active business-day boundary", () => {
  const now = new Date("2026-07-05T16:30:00.000Z");
  const range = resolveBusinessRange("today", now, settings);

  assert.equal(range.label, "Hari ini");
  assert.equal(range.start.toISOString(), "2026-07-05T15:00:00.000Z");
  assert.equal(range.endExclusive.toISOString(), now.toISOString());
});
