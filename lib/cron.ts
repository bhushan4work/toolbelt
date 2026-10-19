// Pure, dependency-free cron parser, explainer, and next-run scheduler.
// Supports standard five-field cron expressions, wildcards, lists, ranges, steps,
// month/day names, and @hourly, @daily, @weekly, @monthly, and @yearly macros.

export type CronFieldName =
  | "minute"
  | "hour"
  | "dayOfMonth"
  | "month"
  | "dayOfWeek";

export interface CronField {
  name: CronFieldName;
  label: string;
  raw: string;
  min: number;
  max: number;
  values: number[];
  isWildcard: boolean;
  isRestricted: boolean;
  description: string;
}

export interface ParsedCron {
  raw: string;
  normalized: string;
  isMacro: boolean;
  macroName?: string;
  fields: {
    minute: CronField;
    hour: CronField;
    dayOfMonth: CronField;
    month: CronField;
    dayOfWeek: CronField;
  };
  fieldsList: CronField[];
  minuteSet: Set<number>;
  hourSet: Set<number>;
  dayOfMonthSet: Set<number>;
  monthSet: Set<number>;
  dayOfWeekSet: Set<number>;
  domRestricted: boolean;
  dowRestricted: boolean;
}

export class CronError extends Error {
  readonly field?: CronFieldName;

  constructor(message: string, field?: CronFieldName) {
    super(message);
    this.name = "CronError";
    this.field = field;
  }
}

export const MACROS: Record<string, string> = {
  "@hourly": "0 * * * *",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@weekly": "0 0 * * 0",
  "@monthly": "0 0 1 * *",
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
};

export const CRON_PRESETS: { label: string; expr: string }[] = [
  { label: "Every minute", expr: "* * * * *" },
  { label: "Every 15 minutes", expr: "*/15 * * * *" },
  { label: "Every hour", expr: "0 * * * *" },
  { label: "Every day at midnight", expr: "0 0 * * *" },
  { label: "Weekdays at 9 AM", expr: "0 9 * * 1-5" },
  { label: "Every Sunday at midnight", expr: "0 0 * * 0" },
  { label: "1st of every month", expr: "0 0 1 * *" },
  { label: "Annual backup", expr: "@yearly" },
];

const MONTH_NAMES: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

const MONTH_NAMES_LIST = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

const DAY_NAMES_LIST = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface FieldConfig {
  name: CronFieldName;
  label: string;
  min: number;
  max: number;
}

const FIELD_CONFIGS: FieldConfig[] = [
  { name: "minute", label: "minute", min: 0, max: 59 },
  { name: "hour", label: "hour", min: 0, max: 23 },
  { name: "dayOfMonth", label: "day of month", min: 1, max: 31 },
  { name: "month", label: "month", min: 1, max: 12 },
  { name: "dayOfWeek", label: "day of week", min: 0, max: 7 },
];

function parseSingleValue(
  valStr: string,
  cfg: FieldConfig
): number {
  const upper = valStr.toUpperCase();
  if (cfg.name === "month" && MONTH_NAMES[upper] !== undefined) {
    return MONTH_NAMES[upper];
  }
  if (cfg.name === "dayOfWeek" && DAY_NAMES[upper] !== undefined) {
    return DAY_NAMES[upper];
  }

  if (!/^\d+$/.test(valStr)) {
    throw new CronError(
      `Invalid ${cfg.label}: unexpected token "${valStr}"`,
      cfg.name
    );
  }

  const val = parseInt(valStr, 10);
  if (val < cfg.min || val > cfg.max) {
    throw new CronError(
      `Invalid ${cfg.label}: ${val} is out of range (${cfg.min}-${cfg.max})`,
      cfg.name
    );
  }

  return val;
}

function parseFieldPart(
  rawPart: string,
  cfg: FieldConfig
): number[] {
  if (!rawPart.trim()) {
    throw new CronError(
      `Invalid ${cfg.label}: empty value in list`,
      cfg.name
    );
  }

  const valuesSet = new Set<number>();
  const subParts = rawPart.split(",");

  for (const sub of subParts) {
    const item = sub.trim();
    if (!item) {
      throw new CronError(
        `Invalid ${cfg.label}: empty value in list`,
        cfg.name
      );
    }

    let rangeStr = item;
    let step = 1;

    if (item.includes("/")) {
      const slashParts = item.split("/");
      if (slashParts.length !== 2) {
        throw new CronError(
          `Invalid ${cfg.label}: multiple "/" step characters in "${item}"`,
          cfg.name
        );
      }
      rangeStr = slashParts[0].trim();
      const stepStr = slashParts[1].trim();

      if (!/^\d+$/.test(stepStr)) {
        throw new CronError(
          `Invalid ${cfg.label}: step must be a positive integer in "${item}"`,
          cfg.name
        );
      }
      step = parseInt(stepStr, 10);
      if (step <= 0) {
        throw new CronError(
          `Invalid ${cfg.label}: step must be greater than 0`,
          cfg.name
        );
      }
    }

    let start: number;
    let end: number;

    if (rangeStr === "*" || rangeStr === "?") {
      start = cfg.min;
      end = cfg.max;
    } else if (rangeStr.includes("-")) {
      const dashParts = rangeStr.split("-");
      if (dashParts.length !== 2) {
        throw new CronError(
          `Invalid ${cfg.label}: multiple "-" range characters in "${rangeStr}"`,
          cfg.name
        );
      }
      start = parseSingleValue(dashParts[0].trim(), cfg);
      end = parseSingleValue(dashParts[1].trim(), cfg);

      if (start > end) {
        throw new CronError(
          `Invalid ${cfg.label}: start (${dashParts[0].trim()}) cannot be greater than end (${dashParts[1].trim()})`,
          cfg.name
        );
      }
    } else {
      const val = parseSingleValue(rangeStr, cfg);
      if (item.includes("/")) {
        start = val;
        end = cfg.max;
      } else {
        start = val;
        end = val;
      }
    }

    for (let i = start; i <= end; i += step) {
      valuesSet.add(i);
    }
  }

  const result = Array.from(valuesSet).sort((a, b) => a - b);
  if (result.length === 0) {
    throw new CronError(
      `Invalid ${cfg.label}: no matching values found`,
      cfg.name
    );
  }

  return result;
}

function formatList(items: (string | number)[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return String(items[0]);
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function formatTime(h: number, m: number): string {
  const mStr = m.toString().padStart(2, "0");
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
}

function formatHourOnly(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${period}`;
}

function describeSingleField(field: CronField): string {
  const { name, raw, values } = field;

  if (name === "minute") {
    if (raw === "*") return "Every minute";
    if (/^\*\/\d+$/.test(raw)) return `Every ${raw.slice(2)} minutes`;
    if (values.length === 1) return `At minute ${values[0]}`;
    if (/^\d+-\d+$/.test(raw)) {
      const [s, e] = raw.split("-");
      return `Minutes ${s} through ${e}`;
    }
    return `At minutes ${formatList(values)}`;
  }

  if (name === "hour") {
    if (raw === "*") return "Every hour";
    if (/^\*\/\d+$/.test(raw)) return `Every ${raw.slice(2)} hours`;
    if (values.length === 1) return `At ${formatHourOnly(values[0])}`;
    if (/^\d+-\d+$/.test(raw)) {
      const [s, e] = raw.split("-").map(Number);
      return `Every hour from ${formatHourOnly(s)} to ${formatHourOnly(e)}`;
    }
    return `At hours ${formatList(values.map(formatHourOnly))}`;
  }

  if (name === "dayOfMonth") {
    if (raw === "*" || raw === "?") return "Every day of the month";
    if (/^\*\/\d+$/.test(raw)) return `Every ${raw.slice(2)} days`;
    if (values.length === 1) return `On day ${values[0]} of the month`;
    if (/^\d+-\d+$/.test(raw)) {
      const [s, e] = raw.split("-");
      return `Days ${s} through ${e} of the month`;
    }
    return `On days ${formatList(values)} of the month`;
  }

  if (name === "month") {
    if (raw === "*") return "Every month";
    if (/^\*\/\d+$/.test(raw)) return `Every ${raw.slice(2)} months`;
    if (values.length === 1) return `In ${MONTH_NAMES_LIST[values[0] - 1]}`;
    if (/^\d+-\d+$/.test(raw)) {
      const [s, e] = raw.split("-").map(Number);
      return `${MONTH_NAMES_LIST[s - 1]} through ${MONTH_NAMES_LIST[e - 1]}`;
    }
    return `In ${formatList(values.map((m) => MONTH_NAMES_LIST[m - 1]))}`;
  }

  if (name === "dayOfWeek") {
    if (raw === "*" || raw === "?") return "Every day of the week";
    if (raw === "1-5") return "Monday through Friday";
    if (raw === "0,6" || raw === "6,0") return "Saturday and Sunday";
    if (/^\*\/\d+$/.test(raw)) return `Every ${raw.slice(2)} days of the week`;
    if (values.length === 1) return `On ${DAY_NAMES_LIST[values[0] % 7]}`;
    if (/^\d+-\d+$/.test(raw)) {
      const [s, e] = raw.split("-").map(Number);
      return `${DAY_NAMES_LIST[s % 7]} through ${DAY_NAMES_LIST[e % 7]}`;
    }
    return `On ${formatList(values.map((d) => DAY_NAMES_LIST[d % 7]))}`;
  }

  return raw;
}

export function parseCron(expr: string): ParsedCron {
  const trimmed = expr.trim();
  if (!trimmed) {
    throw new CronError("Empty cron expression");
  }

  let normalized = trimmed;
  let isMacro = false;
  let macroName: string | undefined;

  if (trimmed.startsWith("@")) {
    const lower = trimmed.toLowerCase();
    if (!MACROS[lower]) {
      throw new CronError(`Unknown macro: ${trimmed}`);
    }
    isMacro = true;
    macroName = trimmed;
    normalized = MACROS[lower];
  }

  const parts = normalized.split(/\s+/);
  if (parts.length !== 5) {
    throw new CronError(
      `Expected 5 fields or a macro, got ${parts.length} fields`
    );
  }

  const fieldList: CronField[] = [];
  for (let i = 0; i < 5; i++) {
    const cfg = FIELD_CONFIGS[i];
    const rawPart = parts[i];
    const values = parseFieldPart(rawPart, cfg);
    const isWildcard = rawPart === "*";
    const isRestricted = rawPart !== "*" && rawPart !== "?";

    const fieldObj: CronField = {
      name: cfg.name,
      label: cfg.label,
      raw: rawPart,
      min: cfg.min,
      max: cfg.max,
      values,
      isWildcard,
      isRestricted,
      description: "",
    };
    fieldObj.description = describeSingleField(fieldObj);
    fieldList.push(fieldObj);
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = fieldList;

  const minuteSet = new Set(minute.values);
  const hourSet = new Set(hour.values);
  const dayOfMonthSet = new Set(dayOfMonth.values);
  const monthSet = new Set(month.values);
  const dayOfWeekSet = new Set<number>();
  for (const dow of dayOfWeek.values) {
    dayOfWeekSet.add(dow % 7);
    if (dow === 7 || dow === 0) {
      dayOfWeekSet.add(0);
      dayOfWeekSet.add(7);
    }
  }

  return {
    raw: expr,
    normalized,
    isMacro,
    macroName,
    fields: {
      minute,
      hour,
      dayOfMonth,
      month,
      dayOfWeek,
    },
    fieldsList: fieldList,
    minuteSet,
    hourSet,
    dayOfMonthSet,
    monthSet,
    dayOfWeekSet,
    domRestricted: dayOfMonth.isRestricted,
    dowRestricted: dayOfWeek.isRestricted,
  };
}

export function describeCron(parsed: ParsedCron): string {
  if (parsed.isMacro && parsed.macroName) {
    const macroLower = parsed.macroName.toLowerCase();
    switch (macroLower) {
      case "@hourly":
        return "Every hour, at minute 0";
      case "@daily":
      case "@midnight":
        return "At 12:00 AM, every day";
      case "@weekly":
        return "At 12:00 AM, on Sunday";
      case "@monthly":
        return "At 12:00 AM, on day 1 of the month";
      case "@yearly":
      case "@annually":
        return "At 12:00 AM, on day 1 of January";
    }
  }

  const { minute, hour, dayOfMonth, month, dayOfWeek } = parsed.fields;

  // 1. Time string
  let timeStr = "";
  if (minute.raw === "*" && hour.raw === "*") {
    timeStr = "Every minute";
  } else if (/^\*\/\d+$/.test(minute.raw) && hour.raw === "*") {
    const step = parseInt(minute.raw.slice(2), 10);
    timeStr = `Every ${step} minutes`;
  } else if (minute.raw === "0" && hour.raw === "*") {
    timeStr = "Every hour, at minute 0";
  } else if (/^\*\/\d+$/.test(hour.raw) && minute.raw === "0") {
    const step = parseInt(hour.raw.slice(2), 10);
    timeStr = `Every ${step} hours`;
  } else if (hour.values.length === 1 && minute.values.length === 1) {
    timeStr = `At ${formatTime(hour.values[0], minute.values[0])}`;
  } else if (hour.values.length === 1 && /^\*\/\d+$/.test(minute.raw)) {
    const step = parseInt(minute.raw.slice(2), 10);
    timeStr = `Every ${step} minutes, past hour ${hour.values[0]}`;
  } else if (hour.values.length === 1) {
    timeStr = `At minute ${formatList(minute.values)} past hour ${hour.values[0]}`;
  } else if (minute.values.length === 1 && hour.values.length > 1) {
    timeStr = `At ${formatList(
      hour.values.map((h) => formatTime(h, minute.values[0]))
    )}`;
  } else {
    timeStr = `At minute ${formatList(minute.values)}, hour ${formatList(
      hour.values
    )}`;
  }

  // 2. Day / Month string
  const domRestricted = parsed.domRestricted;
  const dowRestricted = parsed.dowRestricted;
  const monthRestricted = month.raw !== "*";

  let monthStr = "";
  if (monthRestricted) {
    if (month.values.length === 1) {
      monthStr = `in ${MONTH_NAMES_LIST[month.values[0] - 1]}`;
    } else if (/^\d+-\d+$/.test(month.raw)) {
      const [s, e] = month.raw.split("-").map(Number);
      monthStr = `in ${MONTH_NAMES_LIST[s - 1]} through ${MONTH_NAMES_LIST[e - 1]}`;
    } else {
      monthStr = `in ${formatList(
        month.values.map((m) => MONTH_NAMES_LIST[m - 1])
      )}`;
    }
  }

  let domStr = "";
  if (domRestricted) {
    if (dayOfMonth.values.length === 1) {
      domStr = `on day ${dayOfMonth.values[0]} of the month`;
    } else if (/^\d+-\d+$/.test(dayOfMonth.raw)) {
      const [s, e] = dayOfMonth.raw.split("-").map(Number);
      domStr = `on days ${s} through ${e} of the month`;
    } else {
      domStr = `on days ${formatList(dayOfMonth.values)} of the month`;
    }
  }

  let dowStr = "";
  if (dowRestricted) {
    if (
      dayOfWeek.raw === "1-5" ||
      (dayOfWeek.values.length === 5 &&
        [1, 2, 3, 4, 5].every((d) => dayOfWeek.values.includes(d)))
    ) {
      dowStr = "Monday through Friday";
    } else if (
      dayOfWeek.raw === "0,6" ||
      dayOfWeek.raw === "6,0" ||
      (dayOfWeek.values.length === 2 &&
        dayOfWeek.values.includes(0) &&
        dayOfWeek.values.includes(6))
    ) {
      dowStr = "on Saturday and Sunday";
    } else if (dayOfWeek.values.length === 1) {
      dowStr = `on ${DAY_NAMES_LIST[dayOfWeek.values[0] % 7]}`;
    } else if (/^\d+-\d+$/.test(dayOfWeek.raw)) {
      const [s, e] = dayOfWeek.raw.split("-").map(Number);
      dowStr = `${DAY_NAMES_LIST[s % 7]} through ${DAY_NAMES_LIST[e % 7]}`;
    } else {
      dowStr = `on ${formatList(
        dayOfWeek.values.map((d) => DAY_NAMES_LIST[d % 7])
      )}`;
    }
  }

  if (!domRestricted && !dowRestricted && !monthRestricted) {
    if (
      timeStr === "Every minute" ||
      timeStr.startsWith("Every ") ||
      timeStr.includes("of every hour")
    ) {
      return timeStr;
    }
    return `${timeStr}, every day`;
  }

  let dayPart = "";
  if (domRestricted && dowRestricted) {
    dayPart = `${domStr} or ${dowStr.startsWith("on ") ? dowStr : "on " + dowStr}`;
  } else if (domRestricted) {
    dayPart = domStr;
  } else if (dowRestricted) {
    dayPart = dowStr;
  } else {
    dayPart = "every day";
  }

  if (monthStr) {
    return `${timeStr}, ${dayPart} ${monthStr}`;
  }
  return `${timeStr}, ${dayPart}`;
}

export function nextRuns(
  parsed: ParsedCron,
  from: Date = new Date(),
  count: number = 5,
  options: { utc?: boolean } = {}
): Date[] {
  if (count <= 0) return [];
  const utc = !!options.utc;
  const runs: Date[] = [];

  // Start candidate at the next whole minute after `from`
  let candidate: Date;
  if (utc) {
    const y = from.getUTCFullYear();
    const m = from.getUTCMonth();
    const d = from.getUTCDate();
    const h = from.getUTCHours();
    const min = from.getUTCMinutes() + 1;
    candidate = new Date(Date.UTC(y, m, d, h, min, 0, 0));
  } else {
    const y = from.getFullYear();
    const m = from.getMonth();
    const d = from.getDate();
    const h = from.getHours();
    const min = from.getMinutes() + 1;
    candidate = new Date(y, m, d, h, min, 0, 0);
  }

  // 5 years search limit to bound impossible schedules without excessive computation
  const maxDate = new Date(
    candidate.getTime() + 5 * 366 * 24 * 60 * 60 * 1000
  );
  let steps = 0;
  const maxSteps = 100_000;

  while (runs.length < count && candidate <= maxDate && steps < maxSteps) {
    steps++;

    const y = utc ? candidate.getUTCFullYear() : candidate.getFullYear();
    const mIndex = utc ? candidate.getUTCMonth() : candidate.getMonth();
    const month = mIndex + 1; // 1-12

    // 1. Month check
    if (!parsed.monthSet.has(month)) {
      candidate = utc
        ? new Date(Date.UTC(y, mIndex + 1, 1, 0, 0, 0, 0))
        : new Date(y, mIndex + 1, 1, 0, 0, 0, 0);
      continue;
    }

    // 2. Day check
    const d = utc ? candidate.getUTCDate() : candidate.getDate();
    const dow = utc ? candidate.getUTCDay() : candidate.getDay(); // 0-6 (0=Sun)
    const daysInMonth = utc
      ? new Date(Date.UTC(y, mIndex + 1, 0)).getUTCDate()
      : new Date(y, mIndex + 1, 0).getDate();

    if (d > daysInMonth) {
      candidate = utc
        ? new Date(Date.UTC(y, mIndex + 1, 1, 0, 0, 0, 0))
        : new Date(y, mIndex + 1, 1, 0, 0, 0, 0);
      continue;
    }

    const matchDom = parsed.dayOfMonthSet.has(d);
    const matchDow =
      parsed.dayOfWeekSet.has(dow) || (dow === 0 && parsed.dayOfWeekSet.has(7));

    let dayMatches = false;
    if (parsed.domRestricted && parsed.dowRestricted) {
      // Standard cron OR semantics when both are restricted
      dayMatches = matchDom || matchDow;
    } else if (parsed.domRestricted) {
      dayMatches = matchDom;
    } else if (parsed.dowRestricted) {
      dayMatches = matchDow;
    } else {
      dayMatches = true;
    }

    if (!dayMatches) {
      candidate = utc
        ? new Date(Date.UTC(y, mIndex, d + 1, 0, 0, 0, 0))
        : new Date(y, mIndex, d + 1, 0, 0, 0, 0);
      continue;
    }

    // 3. Hour check
    const h = utc ? candidate.getUTCHours() : candidate.getHours();
    if (!parsed.hourSet.has(h)) {
      let nextH = -1;
      for (let nextHour = h + 1; nextHour < 24; nextHour++) {
        if (parsed.hourSet.has(nextHour)) {
          nextH = nextHour;
          break;
        }
      }
      if (nextH !== -1) {
        candidate = utc
          ? new Date(Date.UTC(y, mIndex, d, nextH, 0, 0, 0))
          : new Date(y, mIndex, d, nextH, 0, 0, 0);
      } else {
        candidate = utc
          ? new Date(Date.UTC(y, mIndex, d + 1, 0, 0, 0, 0))
          : new Date(y, mIndex, d + 1, 0, 0, 0, 0);
      }
      continue;
    }

    // 4. Minute check
    const min = utc ? candidate.getUTCMinutes() : candidate.getMinutes();
    if (!parsed.minuteSet.has(min)) {
      let nextMin = -1;
      for (let mCandidate = min + 1; mCandidate < 60; mCandidate++) {
        if (parsed.minuteSet.has(mCandidate)) {
          nextMin = mCandidate;
          break;
        }
      }
      if (nextMin !== -1) {
        candidate = utc
          ? new Date(Date.UTC(y, mIndex, d, h, nextMin, 0, 0))
          : new Date(y, mIndex, d, h, nextMin, 0, 0);
      } else {
        candidate = utc
          ? new Date(Date.UTC(y, mIndex, d, h + 1, 0, 0, 0))
          : new Date(y, mIndex, d, h + 1, 0, 0, 0);
      }
      continue;
    }

    // Match found!
    runs.push(new Date(candidate.getTime()));

    // Advance candidate by 1 minute
    candidate = utc
      ? new Date(Date.UTC(y, mIndex, d, h, min + 1, 0, 0))
      : new Date(y, mIndex, d, h, min + 1, 0, 0);
  }

  return runs;
}
