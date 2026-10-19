"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock } from "lucide-react";
import {
  parseCron,
  describeCron,
  nextRuns,
  CRON_PRESETS,
  type ParsedCron,
} from "@/lib/cron";
import { CopyButton } from "@/components/shared/CopyButton";
import { ShortcutsLegend } from "@/components/shared/ShortcutsLegend";
import { useRegisterCommands } from "@/components/shared/CommandPalette";
import { cn } from "@/lib/cn";

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

function formatUtcRun(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dayName = days[d.getUTCDay()];
  const monthName = months[d.getUTCMonth()];
  const day = pad(d.getUTCDate());
  const year = d.getUTCFullYear();
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());
  return `${dayName}, ${monthName} ${day}, ${year} ${hours}:${minutes}:${seconds} UTC`;
}

function formatLocalRun(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatRelative(target: Date, from: Date): string {
  const diffMs = target.getTime() - from.getTime();
  if (diffMs <= 0) return "now";
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `in ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `in ${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `in ${diffHours}h ${diffMin % 60}m`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `in ${diffDays}d ${diffHours % 24}h`;
  const diffMonths = Math.floor(diffDays / 30);
  return `in ${diffMonths}mo`;
}

export function CronExplainerClient() {
  const [expr, setExpr] = useState("*/15 * * * *");
  const [utc, setUtc] = useState(true);
  const [localTz, setLocalTz] = useState("Local");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setLocalTz(tz);
    } catch {
      // Fallback to "Local"
    }
  }, []);

  // Update "now" periodically so relative timestamps stay accurate
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + U to toggle UTC / Local
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        setUtc((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Pure derivation: parse, describe, and schedule next runs
  const { parsed, description, runs, error } = useMemo(() => {
    const trimmed = expr.trim();
    if (!trimmed) {
      return {
        parsed: null as ParsedCron | null,
        description: "",
        runs: [] as Date[],
        error: null,
      };
    }

    try {
      const p = parseCron(trimmed);
      const desc = describeCron(p);
      const r = nextRuns(p, now, 5, { utc });
      return {
        parsed: p,
        description: desc,
        runs: r,
        error: null,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid cron expression";
      return {
        parsed: null as ParsedCron | null,
        description: "",
        runs: [] as Date[],
        error: message,
      };
    }
  }, [expr, utc, now]);

  useRegisterCommands(
    "cron-explainer",
    [
      {
        id: "cron:utc",
        section: "Cron",
        title: `Switch to ${utc ? "Local time" : "UTC"}`,
        run: () => setUtc((v) => !v),
      },
      {
        id: "cron:clear",
        section: "Cron",
        title: "Clear input",
        run: () => setExpr(""),
      },
      ...CRON_PRESETS.map((p, idx) => ({
        id: `cron:preset:${idx}`,
        section: "Cron Presets",
        title: `${p.label} (${p.expr})`,
        run: () => setExpr(p.expr),
      })),
    ],
    [expr, utc]
  );

  return (
    <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-12 space-y-6">
      {/* Controls & Shortcuts */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Cron presets"
        >
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-[var(--fg-dim)] mr-1">
            Presets:
          </span>
          {CRON_PRESETS.map((p) => (
            <button
              key={p.expr}
              type="button"
              onClick={() => setExpr(p.expr)}
              className={cn(
                "px-2.5 py-1 rounded text-[12px] font-mono transition-colors border",
                expr.trim() === p.expr
                  ? "border-[var(--rose)] text-[var(--fg)] bg-[rgba(255,77,109,0.12)]"
                  : "border-[var(--hairline)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--hairline-strong)] bg-white/[0.02]"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <ShortcutsLegend
          shortcuts={[
            { keys: [MOD, "U"], label: "Toggle UTC / Local" },
            { keys: [MOD, "K"], label: "Command palette" },
          ]}
        />
      </div>

      {/* Cron Expression Input */}
      <div className="card p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label
            htmlFor="cron-input"
            className="font-mono text-[11px] uppercase tracking-wider text-[var(--fg-dim)] font-medium"
          >
            Cron Expression
          </label>
          <div className="flex items-center gap-2">
            <CopyButton value={expr} label="Copy expression" iconOnly />
            <button
              type="button"
              onClick={() => setExpr("")}
              disabled={!expr}
              className="btn btn-ghost text-[12px] px-2 py-1 text-[var(--fg-dim)] hover:text-[var(--fg)] disabled:opacity-30"
              aria-label="Clear expression"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="relative">
          <input
            id="cron-input"
            type="text"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            placeholder="e.g. */15 * * * * or 0 9 * * 1-5"
            spellCheck={false}
            autoComplete="off"
            aria-label="Cron expression"
            aria-invalid={!!error}
            aria-describedby={error ? "cron-error" : undefined}
            className={cn(
              "w-full px-4 py-3 rounded-lg font-mono text-lg sm:text-xl tracking-wider bg-[var(--bg-soft)] text-[var(--fg)] border transition-colors outline-none",
              error
                ? "border-[var(--rose)] focus:border-[var(--rose)] focus:ring-1 focus:ring-[var(--rose)]"
                : "border-[var(--hairline)] focus:border-[var(--rose)] focus:ring-1 focus:ring-[var(--rose)]"
            )}
          />
        </div>
        {error && (
          <div
            id="cron-error"
            role="alert"
            className="flex items-center gap-2 text-[13px] text-[var(--rose)] font-mono px-1 pt-1"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!expr.trim() && (
        <div className="card p-8 text-center space-y-2 border-dashed">
          <p className="text-[15px] text-[var(--fg-muted)]">
            Enter a cron expression above or pick one of the presets to see its
            explanation, breakdown, and upcoming runs.
          </p>
          <p className="text-[12px] font-mono text-[var(--fg-dim)]">
            Supports 5 fields (minute, hour, day-of-month, month, day-of-week)
            and @hourly, @daily, @weekly, @monthly, @yearly macros.
          </p>
        </div>
      )}

      {/* Plain-English Explanation */}
      {parsed && (
        <div className="card p-5 sm:p-6 border-l-4 border-l-[var(--rose)] space-y-2 bg-[var(--bg-card)]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-[var(--fg-dim)]">
              Plain English Description
            </span>
            <div className="flex items-center gap-2">
              {parsed.isMacro && (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/[0.06] text-[var(--fg-muted)] border border-[var(--hairline)]">
                  Macro: {parsed.macroName} → {parsed.normalized}
                </span>
              )}
              <CopyButton value={description} label="Copy description" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-medium text-[var(--fg)] tracking-tight leading-snug">
            “{description}”
          </p>
        </div>
      )}

      {/* Field-by-Field Breakdown Table */}
      {parsed && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--hairline)] bg-[var(--bg-raise)] flex items-center justify-between">
            <h2 className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
              Field Breakdown
            </h2>
            <span className="text-[12px] font-mono text-[var(--fg-dim)]">
              5 fields
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[13px]">
              <thead>
                <tr className="border-b border-[var(--hairline)] text-[var(--fg-dim)] text-[11px] uppercase tracking-wider">
                  <th scope="col" className="px-4 py-2.5">
                    Field
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    Expression
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    Allowed values
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-sans">
                    Meaning
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hairline)]">
                {parsed.fieldsList.map((f) => (
                  <tr
                    key={f.name}
                    className="hover:bg-white/[0.015] transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-[var(--fg)] capitalize">
                      {f.label}
                    </td>
                    <td className="px-4 py-3">
                      <code className="px-2 py-0.5 rounded bg-[var(--bg-soft)] border border-[var(--hairline)] text-[var(--rose)]">
                        {f.raw}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-[var(--fg-dim)] text-[12px]">
                      {f.min}–{f.max}
                      {f.name === "month" && " (or JAN–DEC)"}
                      {f.name === "dayOfWeek" && " (0=Sun, 7=Sun, or SUN–SAT)"}
                    </td>
                    <td className="px-4 py-3 font-sans text-[13.5px] text-[var(--fg-muted)]">
                      {f.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Next Five Scheduled Runs */}
      {parsed && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--hairline)] bg-[var(--bg-raise)] flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--rose)]" />
              <h2 className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
                Next 5 Scheduled Runs
              </h2>
            </div>
            <div
              className="segmented"
              role="tablist"
              aria-label="Timezone display"
            >
              <button
                role="tab"
                type="button"
                aria-selected={utc}
                data-active={utc}
                onClick={() => setUtc(true)}
              >
                UTC
              </button>
              <button
                role="tab"
                type="button"
                aria-selected={!utc}
                data-active={!utc}
                onClick={() => setUtc(false)}
              >
                Local ({localTz})
              </button>
            </div>
          </div>
          {runs.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-[14px] text-[var(--fg-muted)]">
                No upcoming runs found within the next 5 years.
              </p>
              <p className="text-[12px] font-mono text-[var(--fg-dim)]">
                This schedule appears impossible to satisfy (e.g. day 31 of
                February).
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--hairline)] font-mono text-[13px]">
              {runs.map((r, i) => (
                <li
                  key={r.toISOString()}
                  className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap hover:bg-white/[0.015] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold bg-white/[0.04] text-[var(--fg-dim)] border border-[var(--hairline)]">
                      {i + 1}
                    </span>
                    <span className="text-[var(--fg)] font-medium">
                      {utc ? formatUtcRun(r) : formatLocalRun(r)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] text-[var(--fg-dim)]">
                      {formatRelative(r, now)}
                    </span>
                    <CopyButton
                      value={utc ? r.toISOString() : r.toString()}
                      label="Copy timestamp"
                      iconOnly
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
