import type { MetadataRoute } from "next";
import { SITE_URL, TOOLS, type Tool } from "@/lib/tools";
import { SITE_PUBLISHED } from "@/lib/jsonLd";

export function getSitemapDates(): Record<string, string> {
  if (process.env.SITEMAP_DATES) {
    try {
      return JSON.parse(process.env.SITEMAP_DATES);
    } catch {
      /* ignore malformed json */
    }
  }
  return {};
}

export function getUrlLastModified(
  path: string,
  dates: Record<string, string> = getSitemapDates(),
  tool?: Tool
): Date {
  const dateStr = tool?.lastModified ?? dates[path] ?? process.env.BUILD_DATE ?? SITE_PUBLISHED;
  return new Date(dateStr);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const dates = getSitemapDates();
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: getUrlLastModified("/", dates),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...TOOLS.map((t) => ({
      url: `${SITE_URL}${t.path}`,
      lastModified: getUrlLastModified(t.path, dates, t),
      changeFrequency: "weekly" as const,
      priority: t.sitemapPriority,
    })),
  ];
}
