import type { MetadataRoute } from "next";
import { SITE_URL, TOOLS, type Tool } from "@/lib/tools";
import { GUIDES, type Guide } from "@/lib/guides";
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
  item?: Tool | Guide | { lastModified?: string }
): Date {
  const dateStr = item?.lastModified ?? dates[path] ?? process.env.BUILD_DATE ?? SITE_PUBLISHED;
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
    {
      url: `${SITE_URL}/guides`,
      lastModified: getUrlLastModified("/guides", dates),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...GUIDES.map((g) => ({
      url: `${SITE_URL}${g.path}`,
      lastModified: getUrlLastModified(g.path, dates, g),
      changeFrequency: "weekly" as const,
      priority: g.sitemapPriority,
    })),
  ];
}
