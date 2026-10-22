// Single source of truth for the guides collection. The guides index, per-guide
// metadata, JSON-LD (Article, HowTo, BreadcrumbList), social share images, and
// sitemap all derive from this array — adding a guide means adding one entry here
// (plus its route under app/guides/).

export interface GuideStep {
  name: string;
  text: string;
  url?: string;
}

export interface GuideFaq {
  q: string;
  a: string;
}

export interface Guide {
  slug: string;
  path: string;
  // Index card
  title: string;
  tagline: string;
  cardDescription: string;
  tags: string[];
  /** Theme-aware CSS variable name, e.g. "--sky" (accessible in both themes). */
  accentVar: string;
  /** Raw hex for the decorative glow and OG card accents. */
  accentHex: string;
  // Metadata
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  // Dates
  publishedAt: string; // ISO date string (YYYY-MM-DD)
  updatedAt?: string; // ISO date string (YYYY-MM-DD)
  // Reading duration
  readingTime: string;
  /** ISO 8601 duration string for HowTo schema (e.g. "PT4M"). */
  totalTime?: string;
  // Steps for HowTo structured data and guided walkthrough
  steps: GuideStep[];
  // Related tools
  relatedTools?: string[];
  // FAQs
  faqs?: GuideFaq[];
  sitemapPriority: number;
  /** ISO date string (YYYY-MM-DD) overriding build-time git history for the sitemap. */
  lastModified?: string;
}

export const GUIDES: Guide[] = [
  {
    slug: "format-and-validate-json",
    path: "/guides/format-and-validate-json",
    title: "How to Format and Validate JSON",
    tagline: "JSON Guide",
    cardDescription:
      "A step-by-step walkthrough for formatting messy JSON, validating syntax, catching common parsing errors, and converting documents locally.",
    tags: ["JSON", "Validation", "Formatting", "TypeScript"],
    accentVar: "--sky",
    accentHex: "#5AB5FF",
    metaTitle: "How to Format and Validate JSON - Developer Guide",
    metaDescription:
      "Step-by-step guide to formatting, validating syntax, and converting JSON to TypeScript, CSV, or YAML directly in your browser with zero data leaks.",
    ogTitle: "How to Format and Validate JSON - CODERCOPS Guides",
    ogDescription:
      "Learn how to format, validate, and convert JSON documents locally with syntax highlighting, error detection, and lossless precision.",
    publishedAt: "2026-10-23",
    updatedAt: "2026-10-23",
    readingTime: "4 min read",
    totalTime: "PT4M",
    steps: [
      {
        name: "Paste or load raw JSON data",
        text: "Copy your raw or unformatted JSON payload from an API response, config file, or clipboard into the input editor.",
        url: "#step-1",
      },
      {
        name: "Inspect syntax errors and validation alerts",
        text: "Check the syntax validator indicator. If the document is invalid, inspect the line and character indicators pinpointing missing quotes, trailing commas, or unbalanced braces.",
        url: "#step-2",
      },
      {
        name: "Format with custom indentation or minify",
        text: "Choose 2-space or 4-space indentation to pretty-print the document, or use Minify to strip all superfluous whitespace for production transport.",
        url: "#step-3",
      },
      {
        name: "Explore the collapsible tree view",
        text: "Switch to the Tree view to interactively inspect deep object hierarchies, expand or collapse nested nodes, and preserve high-precision numbers with lossless parsing.",
        url: "#step-4",
      },
      {
        name: "Convert JSON to TypeScript, CSV, or YAML",
        text: "Export your validated JSON data into strongly-typed TypeScript interfaces, clean tabular CSV rows, or human-friendly YAML configuration.",
        url: "#step-5",
      },
    ],
    faqs: [
      {
        q: "Is formatting JSON online safe for private or customer data?",
        a: "It is safe only if the tool runs 100% client-side. CODERCOPS JSON Formatter performs all parsing, validation, and conversion directly within your browser. No payloads are ever uploaded to a remote server.",
      },
      {
        q: "Why won't my JSON parse?",
        a: "JSON parsing fails on syntax errors such as unquoted object keys, single-quoted strings, or trailing commas after the last element. JSON requires double-quoted keys and strings, and does not allow trailing commas.",
      },
      {
        q: "Why do large integers change value?",
        a: "Large integers can parse successfully but lose precision once they exceed JavaScript's safe integer range (9,007,199,254,740,991). The formatter's lossless mode preserves the exact digits of 64-bit IDs and other high-precision numbers instead of rounding them.",
      },
      {
        q: "How can I convert JSON to TypeScript types?",
        a: "Use the TypeScript conversion tab inside the JSON Formatter tool. It analyzes property types across objects and arrays, automatically merging structures and generating typed interfaces.",
      },
    ],
    relatedTools: ["json-formatter"],
    sitemapPriority: 0.8,
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getRelatedGuides(
  currentSlug: string,
  limit = 3,
  guides: Guide[] = GUIDES
): Guide[] {
  return guides.filter((g) => g.slug !== currentSlug).slice(0, limit);
}
