// Reads .lighthouseci/assertion-results.json, outputs a summary table,
// emits GitHub Actions step summary and warnings/errors when budgets are exceeded.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

const RESULTS_PATH = '.lighthouseci/assertion-results.json';

if (!existsSync(RESULTS_PATH)) {
  console.error(`Error: Assertion results not found at ${RESULTS_PATH}`);
  process.exit(1);
}

const results = JSON.parse(readFileSync(RESULTS_PATH, 'utf8'));

const routes = {};
let hasError = false;

for (const r of results) {
  const route = new URL(r.url).pathname;
  if (!routes[route]) {
    routes[route] = {
      lcp: '-',
      cls: '-',
      bundle: '-',
      warnings: [],
      errors: [],
    };
  }

  const key = r.auditProperty ? `${r.auditId}:${r.auditProperty}` : r.auditId;
  if (key === 'largest-contentful-paint' && r.level === 'warn') {
    routes[route].lcp = `${Math.round(r.actual)} ms`;
  } else if (key === 'cumulative-layout-shift' && r.level === 'warn') {
    routes[route].cls = Number(r.actual).toFixed(3);
  } else if (key === 'total-byte-weight' && r.level === 'warn') {
    routes[route].bundle = `${Math.round(r.actual / 1024)} KiB`;
  }

  if (!r.passed) {
    const detail = `${r.auditTitle || r.auditId}: expected ${r.operator} ${r.expected}, found ${r.actual}`;
    if (r.level === 'error') {
      hasError = true;
      routes[route].errors.push(detail);
      if (process.env.GITHUB_ACTIONS) {
        console.log(`::error title=Lighthouse Budget Failed (${r.auditId})::${route} - ${detail}`);
      }
    } else {
      routes[route].warnings.push(detail);
      if (process.env.GITHUB_ACTIONS) {
        console.log(`::warning title=Lighthouse Budget Exceeded (${r.auditId})::${route} - ${detail}`);
      }
    }
  }
}

let md = '### 🚦 Lighthouse CI Performance Budgets\n\n';
md += '| Route | LCP (budget ≤ 2500 ms) | CLS (budget ≤ 0.100) | Bundle Size (budget ≤ 500 KiB) | Status |\n';
md += '|---|---|---|---|---|\n';

for (const [route, d] of Object.entries(routes)) {
  let status = '✅ Pass';
  if (d.errors.length) {
    status = '❌ Fail';
  } else if (d.warnings.length) {
    status = '⚠️ Warning';
  }
  md += `| \`${route}\` | ${d.lcp} | ${d.cls} | ${d.bundle} | ${status} |\n`;
}

const allNotices = [];
for (const [route, d] of Object.entries(routes)) {
  for (const err of d.errors) {
    allNotices.push(`- ❌ \`${route}\`: ${err}`);
  }
  for (const warn of d.warnings) {
    allNotices.push(`- ⚠️ \`${route}\`: ${warn}`);
  }
}

if (allNotices.length > 0) {
  md += '\n#### Budget Notices\n\n' + allNotices.join('\n') + '\n';
}

console.log(md);

if (process.env.GITHUB_STEP_SUMMARY) {
  try {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
  } catch (err) {
    console.error('Failed to append to GITHUB_STEP_SUMMARY:', err);
  }
}

if (hasError) {
  console.error('Lighthouse budget check failed with error-level assertions.');
  process.exit(1);
}
