import { describe, it, expect, afterEach } from "vitest";
import sitemap, { getSitemapDates, getUrlLastModified } from "@/app/sitemap";
import { SITE_URL, TOOLS, type Tool } from "@/lib/tools";
import { SITE_PUBLISHED } from "@/lib/jsonLd";

describe("sitemap", () => {
  const originalSitemapDates = process.env.SITEMAP_DATES;
  const originalBuildDate = process.env.BUILD_DATE;

  afterEach(() => {
    if (originalSitemapDates !== undefined) {
      process.env.SITEMAP_DATES = originalSitemapDates;
    } else {
      delete process.env.SITEMAP_DATES;
    }

    if (originalBuildDate !== undefined) {
      process.env.BUILD_DATE = originalBuildDate;
    } else {
      delete process.env.BUILD_DATE;
    }
  });

  it("includes the homepage and all registered tools", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls).toContain(`${SITE_URL}/`);
    for (const tool of TOOLS) {
      expect(urls).toContain(`${SITE_URL}${tool.path}`);
    }
    expect(entries).toHaveLength(TOOLS.length + 1);
  });

  it("assigns distinct lastModified dates to URLs from build metadata", () => {
    process.env.SITEMAP_DATES = JSON.stringify({
      "/": "2026-07-08",
      "/base64": "2026-10-15",
      "/color-converter": "2026-10-17",
      "/json-formatter": "2026-10-18",
    });

    const entries = sitemap();
    const home = entries.find((e) => e.url === `${SITE_URL}/`);
    const base64 = entries.find((e) => e.url === `${SITE_URL}/base64`);
    const color = entries.find((e) => e.url === `${SITE_URL}/color-converter`);
    const json = entries.find((e) => e.url === `${SITE_URL}/json-formatter`);

    expect(home?.lastModified).toEqual(new Date("2026-07-08"));
    expect(base64?.lastModified).toEqual(new Date("2026-10-15"));
    expect(color?.lastModified).toEqual(new Date("2026-10-17"));
    expect(json?.lastModified).toEqual(new Date("2026-10-18"));

    // Ensure dates are not identical
    expect(base64?.lastModified).not.toEqual(home?.lastModified);
    expect(color?.lastModified).not.toEqual(base64?.lastModified);
  });

  it("prioritizes content lastModified when defined on a tool", () => {
    const customTool: Tool = {
      ...TOOLS[0],
      path: "/custom-tool",
      lastModified: "2026-09-01",
    };

    const date = getUrlLastModified("/custom-tool", { "/custom-tool": "2026-10-01" }, customTool);
    expect(date).toEqual(new Date("2026-09-01"));
  });

  it("falls back to BUILD_DATE when route is absent from SITEMAP_DATES", () => {
    delete process.env.SITEMAP_DATES;
    process.env.BUILD_DATE = "2026-10-19";

    const date = getUrlLastModified("/unmapped-tool");
    expect(date).toEqual(new Date("2026-10-19"));
  });

  it("falls back to SITE_PUBLISHED when neither SITEMAP_DATES nor BUILD_DATE is set", () => {
    delete process.env.SITEMAP_DATES;
    delete process.env.BUILD_DATE;

    const date = getUrlLastModified("/unmapped-tool");
    expect(date).toEqual(new Date(SITE_PUBLISHED));
  });

  it("safely handles invalid JSON in SITEMAP_DATES", () => {
    process.env.SITEMAP_DATES = "{invalid-json";
    delete process.env.BUILD_DATE;

    expect(getSitemapDates()).toEqual({});
    const date = getUrlLastModified("/");
    expect(date).toEqual(new Date(SITE_PUBLISHED));
  });
});
