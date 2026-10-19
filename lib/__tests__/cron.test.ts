import { describe, it, expect } from "vitest";
import {
  parseCron,
  describeCron,
  nextRuns,
  CronError,
} from "../cron";

describe("cron acceptance criteria", () => {
  it("criterion 1: parses and describes */15 * * * *", () => {
    const parsed = parseCron("*/15 * * * *");
    expect(parsed.fields.minute.values).toEqual([0, 15, 30, 45]);
    expect(parsed.fields.hour.isWildcard).toBe(true);
    expect(describeCron(parsed)).toBe("Every 15 minutes");

    const base = new Date("2026-01-01T00:00:00.000Z");
    const runs = nextRuns(parsed, base, 3, { utc: true });
    expect(runs).toHaveLength(3);
    expect(runs[0].toISOString()).toBe("2026-01-01T00:15:00.000Z");
    expect(runs[1].toISOString()).toBe("2026-01-01T00:30:00.000Z");
    expect(runs[2].toISOString()).toBe("2026-01-01T00:45:00.000Z");
  });

  it("criterion 2: weekday scheduling with 0 9 * * 1-5", () => {
    const parsed = parseCron("0 9 * * 1-5");
    expect(describeCron(parsed)).toBe("At 9:00 AM, Monday through Friday");
    expect(parsed.dowRestricted).toBe(true);
    expect(parsed.domRestricted).toBe(false);

    // 2026-01-01 was a Thursday
    const base = new Date("2026-01-01T00:00:00.000Z");
    const runs = nextRuns(parsed, base, 5, { utc: true });
    expect(runs).toHaveLength(5);
    // Jan 1: Thu, Jan 2: Fri, Jan 3: Sat (skipped), Jan 4: Sun (skipped), Jan 5: Mon, Jan 6: Tue, Jan 7: Wed
    expect(runs[0].toISOString()).toBe("2026-01-01T09:00:00.000Z");
    expect(runs[1].toISOString()).toBe("2026-01-02T09:00:00.000Z");
    expect(runs[2].toISOString()).toBe("2026-01-05T09:00:00.000Z");
    expect(runs[3].toISOString()).toBe("2026-01-06T09:00:00.000Z");
    expect(runs[4].toISOString()).toBe("2026-01-07T09:00:00.000Z");

    for (const r of runs) {
      const dow = r.getUTCDay();
      expect(dow).toBeGreaterThanOrEqual(1);
      expect(dow).toBeLessThanOrEqual(5);
      expect(r.getUTCHours()).toBe(9);
      expect(r.getUTCMinutes()).toBe(0);
    }
  });

  it("criterion 3: deterministic next runs from a fixed UTC date", () => {
    const parsed = parseCron("30 4 1,15 * *");
    const fixed = new Date("2026-03-01T00:00:00.000Z");

    const runs1 = nextRuns(parsed, fixed, 4, { utc: true });
    const runs2 = nextRuns(parsed, fixed, 4, { utc: true });

    expect(runs1.map((d) => d.toISOString())).toEqual([
      "2026-03-01T04:30:00.000Z",
      "2026-03-15T04:30:00.000Z",
      "2026-04-01T04:30:00.000Z",
      "2026-04-15T04:30:00.000Z",
    ]);
    expect(runs1.map((d) => d.toISOString())).toEqual(
      runs2.map((d) => d.toISOString())
    );
  });

  it("criterion 4: 0 0 1 * 1 correctly implements standard cron OR semantics", () => {
    const parsed = parseCron("0 0 1 * 1");
    expect(parsed.domRestricted).toBe(true);
    expect(parsed.dowRestricted).toBe(true);
    expect(describeCron(parsed)).toContain("day 1 of the month or on Monday");

    // In Jan 2026:
    // Jan 1 is Thursday (DOM matches, DOW does not)
    // Jan 5 is Monday (DOM does not match, DOW matches)
    // Jan 12 is Monday
    // Jan 19 is Monday
    // Jan 26 is Monday
    // Feb 1 is Sunday (DOM matches, DOW does not)
    const base = new Date("2025-12-31T23:59:00.000Z");
    const runs = nextRuns(parsed, base, 6, { utc: true });
    expect(runs.map((d) => d.toISOString())).toEqual([
      "2026-01-01T00:00:00.000Z", // matches DOM 1 (Thursday)
      "2026-01-05T00:00:00.000Z", // matches DOW Monday (day 5)
      "2026-01-12T00:00:00.000Z", // matches DOW Monday
      "2026-01-19T00:00:00.000Z", // matches DOW Monday
      "2026-01-26T00:00:00.000Z", // matches DOW Monday
      "2026-02-01T00:00:00.000Z", // matches DOM 1 (Sunday)
    ]);
  });

  it("criterion 5: impossible 0 0 31 2 * terminates promptly returning empty runs", () => {
    const parsed = parseCron("0 0 31 2 *");
    const base = new Date("2026-01-01T00:00:00.000Z");
    const start = Date.now();
    const runs = nextRuns(parsed, base, 5, { utc: true });
    const elapsed = Date.now() - start;

    expect(runs).toEqual([]);
    expect(elapsed).toBeLessThan(100);
  });

  it("criterion 6: 60 * * * * rejects and reports the minute field", () => {
    expect(() => parseCron("60 * * * *")).toThrowError(/minute/i);

    try {
      parseCron("60 * * * *");
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(CronError);
      const cronErr = err as CronError;
      expect(cronErr.field).toBe("minute");
      expect(cronErr.message.toLowerCase()).toContain("minute");
    }
  });
});

describe("field-specific error reporting", () => {
  it("reports hour errors", () => {
    expect(() => parseCron("* 24 * * *")).toThrowError(/hour/i);
    try {
      parseCron("* 24 * * *");
    } catch (e) {
      expect((e as CronError).field).toBe("hour");
    }
  });

  it("reports day of month errors", () => {
    expect(() => parseCron("* * 0 * *")).toThrowError(/day of month/i);
    expect(() => parseCron("* * 32 * *")).toThrowError(/day of month/i);
    try {
      parseCron("* * 32 * *");
    } catch (e) {
      expect((e as CronError).field).toBe("dayOfMonth");
    }
  });

  it("reports month errors", () => {
    expect(() => parseCron("* * * 0 *")).toThrowError(/month/i);
    expect(() => parseCron("* * * 13 *")).toThrowError(/month/i);
    expect(() => parseCron("* * * FOO *")).toThrowError(/month/i);
    try {
      parseCron("* * * 13 *");
    } catch (e) {
      expect((e as CronError).field).toBe("month");
    }
  });

  it("reports day of week errors", () => {
    expect(() => parseCron("* * * * 8")).toThrowError(/day of week/i);
    expect(() => parseCron("* * * * FOO")).toThrowError(/day of week/i);
    try {
      parseCron("* * * * 8");
    } catch (e) {
      expect((e as CronError).field).toBe("dayOfWeek");
    }
  });

  it("reports step errors", () => {
    expect(() => parseCron("*/0 * * * *")).toThrowError(/minute/i);
    expect(() => parseCron("*/0 * * * *")).toThrowError(/step/i);
  });

  it("reports inverted ranges", () => {
    expect(() => parseCron("10-5 * * * *")).toThrowError(/minute/i);
    expect(() => parseCron("10-5 * * * *")).toThrowError(/start.*cannot be greater/i);
  });

  it("reports wrong number of fields or invalid input", () => {
    expect(() => parseCron("")).toThrowError(/empty/i);
    expect(() => parseCron("* * * *")).toThrowError(/expected 5 fields/i);
    expect(() => parseCron("* * * * * *")).toThrowError(/expected 5 fields/i);
    expect(() => parseCron("@notamacro")).toThrowError(/unknown macro/i);
  });
});

describe("macros support", () => {
  it("supports @hourly, @daily, @weekly, @monthly, @yearly", () => {
    expect(parseCron("@hourly").normalized).toBe("0 * * * *");
    expect(describeCron(parseCron("@hourly"))).toBe("Every hour, at minute 0");

    expect(parseCron("@daily").normalized).toBe("0 0 * * *");
    expect(describeCron(parseCron("@daily"))).toBe("At 12:00 AM, every day");

    expect(parseCron("@midnight").normalized).toBe("0 0 * * *");

    expect(parseCron("@weekly").normalized).toBe("0 0 * * 0");
    expect(describeCron(parseCron("@weekly"))).toBe("At 12:00 AM, on Sunday");

    expect(parseCron("@monthly").normalized).toBe("0 0 1 * *");
    expect(describeCron(parseCron("@monthly"))).toBe(
      "At 12:00 AM, on day 1 of the month"
    );

    expect(parseCron("@yearly").normalized).toBe("0 0 1 1 *");
    expect(describeCron(parseCron("@yearly"))).toBe(
      "At 12:00 AM, on day 1 of January"
    );

    expect(parseCron("@annually").normalized).toBe("0 0 1 1 *");
  });
});

describe("month and day names support", () => {
  it("supports month names in case-insensitive lists and ranges", () => {
    const parsed = parseCron("0 0 1 JAN,jun,Dec *");
    expect(parsed.fields.month.values).toEqual([1, 6, 12]);

    const rangeParsed = parseCron("0 0 1 mar-MAY *");
    expect(rangeParsed.fields.month.values).toEqual([3, 4, 5]);
  });

  it("supports day names in case-insensitive lists and ranges", () => {
    const parsed = parseCron("0 0 * * mon,WED,fri");
    expect(parsed.fields.dayOfWeek.values).toEqual([1, 3, 5]);

    const rangeParsed = parseCron("0 0 * * MON-FRI");
    expect(rangeParsed.fields.dayOfWeek.values).toEqual([1, 2, 3, 4, 5]);
  });

  it("normalizes day of week 7 to Sunday", () => {
    const parsed = parseCron("0 0 * * 7");
    expect(parsed.dayOfWeekSet.has(0)).toBe(true);
    expect(parsed.dayOfWeekSet.has(7)).toBe(true);

    const base = new Date("2026-01-01T00:00:00.000Z"); // Jan 1 is Thursday
    const runs = nextRuns(parsed, base, 1, { utc: true });
    expect(runs[0].toISOString()).toBe("2026-01-04T00:00:00.000Z"); // Sunday
  });
});

describe("nextRuns local timezone option", () => {
  it("computes runs in local timezone when utc is false", () => {
    const parsed = parseCron("0 12 * * *");
    const base = new Date(2026, 0, 1, 0, 0, 0);
    const runs = nextRuns(parsed, base, 2, { utc: false });
    expect(runs).toHaveLength(2);
    expect(runs[0].getHours()).toBe(12);
    expect(runs[0].getMinutes()).toBe(0);
    expect(runs[1].getHours()).toBe(12);
    expect(runs[1].getMinutes()).toBe(0);
  });
});
