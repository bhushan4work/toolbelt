# Performance Baseline

Initial performance baseline audit for `tools.codercops.com` as part of issue [#28](https://github.com/codercops/toolbelt/issues/28) under the parent SEO initiative ([#18](https://github.com/codercops/toolbelt/issues/18)).

## Scope

Pages were identified strictly through existing route definitions (`lib/tools.ts`, `app/(tools)`) and production site navigation:
- **Home**: `https://tools.codercops.com/` (`/`)
- **JSON Formatter**: `https://tools.codercops.com/json-formatter` (`/json-formatter`)
- **JWT Decoder**: `https://tools.codercops.com/jwt-decoder` (`/jwt-decoder`)
- **Base64**: `https://tools.codercops.com/base64` (`/base64`)
- **Invoice Generator**: `https://tools.codercops.com/invoice-generator` (`/invoice-generator`)

> **Note on URL Encoder (`/url-encoder`)**: The URL Encoder route was checked during the audit, but returned HTTP 404 on production (not yet live). It was therefore excluded from this live production baseline per the maintainer requirements.

## Methodology

- **Tooling**: Audits were conducted using Lighthouse (v13.5.0) in a headless environment.
- **Audit Settings**:
  - **Mobile**: Form factor `mobile`, mobile screen emulation (412 × 823 viewport, DPR 1.75), simulated mobile network & CPU throttling (1,600 Kbps down, 750 Kbps up, 150 ms RTT, 4× CPU slowdown).
  - **Desktop**: Preset `desktop`, desktop screen emulation (1350 × 940 viewport, DPR 1.0), desktop network & CPU throttling (10,000 Kbps down, 3,375 Kbps up, 40 ms RTT, 1× CPU slowdown).
- **Run Count & Median Methodology**: Each page and device combination was audited three times under identical settings. For each metric (LCP, CLS, TBT), the values were sorted across the three runs and the middle value (median) was recorded.
- **Metric Units**:
  - **LCP (Largest Contentful Paint)**: Seconds (`s`)
  - **CLS (Cumulative Layout Shift)**: Unitless score
  - **INP (Interaction to Next Paint)**: Milliseconds (`ms`)
  - **TBT (Total Blocking Time)**: Milliseconds (`ms`)
- **Missing INP Field Data**: Interaction to Next Paint (INP) is a real-user field metric collected over time via the Chrome User Experience Report (CrUX). Because these audits were lab-simulated using Lighthouse and field data is not available in CrUX for these URLs, field INP is recorded exactly as `no field data` without substituting lab metrics.

## Baseline Table

| page | device | date | LCP | CLS | INP | TBT |
| --- | --- | --- | --- | --- | --- | --- |
| Home | mobile | 2026-10-14 | 2.08 s | 0.000 | no field data | 51 ms |
| Home | desktop | 2026-10-14 | 0.69 s | 0.000 | no field data | 0 ms |
| JSON Formatter | mobile | 2026-10-14 | 2.11 s | 0.000 | no field data | 67 ms |
| JSON Formatter | desktop | 2026-10-14 | 0.69 s | 0.002 | no field data | 0 ms |
| JWT Decoder | mobile | 2026-10-14 | 2.12 s | 0.000 | no field data | 102 ms |
| JWT Decoder | desktop | 2026-10-14 | 0.76 s | 0.000 | no field data | 0 ms |
| Base64 | mobile | 2026-10-14 | 2.09 s | 0.000 | no field data | 59 ms |
| Base64 | desktop | 2026-10-14 | 0.70 s | 0.000 | no field data | 0 ms |
| Invoice Generator | mobile | 2026-10-14 | 2.24 s | 0.465 | no field data | 61 ms |
| Invoice Generator | desktop | 2026-10-14 | 0.78 s | 0.554 | no field data | 0 ms |

## Findings and Follow-up Actions

Thresholds evaluated:
- **LCP**: Passing (< 2.5 s) across all pages on both mobile (2.08 s – 2.24 s) and desktop (0.69 s – 0.78 s).
- **TBT**: Passing diagnostic guidance (< 200 ms "Good") across all pages on both mobile (51 ms – 102 ms) and desktop (0 ms).
- **CLS**:
  - Home, JSON Formatter, JWT Decoder, and Base64 passed with minimal or zero shift (CLS ≤ 0.002).
  - **Invoice Generator** failed the CLS threshold (> 0.1) on both desktop (**0.554**) and mobile (**0.465**).
  - Culprit: When `InvoiceGeneratorClient` mounts, it starts with `current = null` rendering a small loading card, which is then replaced after hydration by the full toolbar, editor, and preview grids. This post-hydration swap pushes the FAQ section (`section.mx-auto`) down the page by hundreds of pixels, triggering layout shift.

### Follow-up Issues Filed

- [#159](https://github.com/codercops/toolbelt/issues/159): `perf(invoice-generator): fix high Cumulative Layout Shift (CLS) on desktop and mobile`
