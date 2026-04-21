import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  currentMonth,
  formatMonth,
  getMonthDays,
  isCurrentMonth,
  nextMonth,
  prevMonth,
} from "@/lib/month";

describe("prevMonth", () => {
  it("decrements within a year", () => {
    expect(prevMonth("2026-04")).toBe("2026-03");
  });

  it("wraps to previous year from January", () => {
    expect(prevMonth("2026-01")).toBe("2025-12");
  });

  it("pads single-digit months", () => {
    expect(prevMonth("2026-10")).toBe("2026-09");
  });
});

describe("nextMonth", () => {
  it("increments within a year", () => {
    expect(nextMonth("2026-04")).toBe("2026-05");
  });

  it("wraps to next year from December", () => {
    expect(nextMonth("2025-12")).toBe("2026-01");
  });
});

describe("formatMonth", () => {
  it("formats in French by default", () => {
    expect(formatMonth("2026-04")).toBe("avril 2026");
  });

  it("respects locale override", () => {
    expect(formatMonth("2026-04", "en-US")).toBe("April 2026");
  });
});

describe("getMonthDays", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 12, 10, 0, 0)); // 12 April 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns current day and days left for the current month", () => {
    expect(getMonthDays("2026-04")).toEqual({
      currentDay: 12,
      totalDays: 30,
      daysLeft: 18,
    });
  });

  it("returns full month for past months", () => {
    expect(getMonthDays("2026-01")).toEqual({
      currentDay: 31,
      totalDays: 31,
      daysLeft: 0,
    });
  });

  it("handles leap February", () => {
    expect(getMonthDays("2024-02")).toEqual({
      currentDay: 29,
      totalDays: 29,
      daysLeft: 0,
    });
  });

  it("handles non-leap February", () => {
    expect(getMonthDays("2025-02")).toEqual({
      currentDay: 28,
      totalDays: 28,
      daysLeft: 0,
    });
  });
});

describe("currentMonth & isCurrentMonth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 12, 10, 0, 0)); // April 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns YYYY-MM for today", () => {
    expect(currentMonth()).toBe("2026-04");
  });

  it("isCurrentMonth is true for current and false otherwise", () => {
    expect(isCurrentMonth("2026-04")).toBe(true);
    expect(isCurrentMonth("2026-03")).toBe(false);
  });
});
