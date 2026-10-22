import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { GUIDES } from "@/lib/guides";
import { generateGuidesIndexMetadata } from "@/lib/toolMetadata";
import { guidesIndexBreadcrumbJsonLd, guidesIndexJsonLd } from "@/lib/jsonLd";

export const metadata: Metadata = generateGuidesIndexMetadata();

export default function GuidesIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guidesIndexBreadcrumbJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guidesIndexJsonLd()) }}
      />

      <section className="relative">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-12">
          <div className="mb-4 flex flex-wrap items-center gap-2 font-mono text-[10.5px] tracking-[0.22em] uppercase">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href="/" className="text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true" className="text-[var(--fg-dim)]">
                  /
                </li>
                <li aria-current="page" className="text-[var(--fg)]">
                  Guides
                </li>
              </ol>
            </nav>
            <span aria-hidden="true" className="text-[var(--fg-dim)]">
              ·
            </span>
            <span className="text-[var(--fg-dim)]">Documentation & Walkthroughs</span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-pulse" />
            <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-muted)]">
              Tutorials · Walkthroughs · Best Practices
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[var(--fg)] leading-tight max-w-4xl">
            Developer Guides & Walkthroughs
          </h1>
          <p className="mt-4 max-w-2xl text-[var(--fg-muted)] text-[15px] sm:text-[16px] leading-relaxed">
            In-depth, practical guides on formatting, parsing, cryptography, and conversions.
            Learn the mechanics, avoid edge cases, and build with reliable, privacy-first tools.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={guide.path}
              className="group relative rounded-lg border border-[var(--hairline)] bg-[var(--bg-raise)] p-6 transition-all hover:border-[var(--hairline-strong)] hover:shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-medium"
                    style={{
                      backgroundColor: `color-mix(in srgb, var(${guide.accentVar}) 12%, transparent)`,
                      color: `var(${guide.accentVar})`,
                    }}
                  >
                    <BookOpen className="w-3 h-3" />
                    {guide.tagline}
                  </span>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--fg-dim)]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {guide.readingTime}
                    </span>
                  </div>
                </div>

                <h2 className="font-display text-xl font-semibold text-[var(--fg)] group-hover:text-[var(--cyan)] transition-colors leading-snug">
                  {guide.title}
                </h2>

                <p className="mt-2 text-sm text-[var(--fg-muted)] leading-relaxed line-clamp-3">
                  {guide.cardDescription}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--hairline)] flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {guide.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-base)] text-[var(--fg-dim)] border border-[var(--hairline)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[var(--cyan)] group-hover:translate-x-0.5 transition-transform">
                  Read guide <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
