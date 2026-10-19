/* eslint-disable @typescript-eslint/no-require-imports */
/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

function getGitDate(...filePaths) {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", ...filePaths], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

function getSitemapDates() {
  const dates = {};
  try {
    let isShallow = false;
    try {
      isShallow =
        execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
          stdio: ["ignore", "pipe", "ignore"],
          encoding: "utf8",
        }).trim() === "true";
      if (isShallow) {
        try {
          execFileSync("git", ["fetch", "--unshallow"], {
            stdio: ["ignore", "ignore", "ignore"],
          });
          isShallow =
            execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
              stdio: ["ignore", "pipe", "ignore"],
              encoding: "utf8",
            }).trim() === "true";
        } catch {
          // Unshallow failed (e.g. offline)
        }
      }
    } catch {
      return dates;
    }

    if (isShallow) {
      // In a shallow clone that cannot be unshallowed, do not query git log
      // because every file would falsely inherit the latest commit date.
      return dates;
    }

    const homeDate = getGitDate("app/page.tsx", "lib/tools.ts");
    if (homeDate) dates["/"] = homeDate;

    const toolsDir = "app/(tools)";
    if (fs.existsSync(toolsDir)) {
      for (const entry of fs.readdirSync(toolsDir, { withFileTypes: true })) {
        if (entry.isDirectory() && fs.existsSync(path.join(toolsDir, entry.name, "page.tsx"))) {
          const date = getGitDate(path.join(toolsDir, entry.name));
          if (date) dates[`/${entry.name}`] = date;
        }
      }
    }
  } catch {
    // Filesystem or unexpected error; return dates found so far
  }
  return dates;
}

const nextConfig = {
  reactStrictMode: true,
  // Inlined at build time for the WebSite JSON-LD dateModified and sitemap lastModified.
  env: {
    BUILD_DATE: new Date().toISOString().slice(0, 10),
    SITEMAP_DATES: JSON.stringify(getSitemapDates()),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
