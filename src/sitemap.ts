import type {
  SitemapEntry,
  SitemapIndexEntry,
  SitemapIndexInput,
  SitemapIndexOptions,
  SitemapInput,
  SitemapOptions,
} from "./types";
import {
  escapeXml,
  formatChangefreq,
  formatDate,
  formatPriority,
  normalizeUrl,
} from "./xml";

const DEFAULT_CACHE_CONTROL = "public, max-age=0, must-revalidate";

function toSitemapEntry(input: SitemapInput): SitemapEntry {
  return typeof input === "string" ? { loc: input } : input;
}

function toSitemapIndexEntry(input: SitemapIndexInput): SitemapIndexEntry {
  return typeof input === "string" ? { loc: input } : input;
}

/**
 * Generates a pure, standards-compliant XML sitemap string (`<urlset>`).
 *
 * Designed specifically to emit clean `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
 * without `xmlns:xhtml` or deprecated XSLT directives so that:
 * 1. Search engine crawlers (Googlebot, Bingbot, Yandex) parse every URL reliably.
 * 2. Browsers (Chrome, Edge, Firefox) always display their native collapsible XML tree viewer.
 */
export async function renderSitemap(options: SitemapOptions): Promise<string> {
  const {
    site,
    urls = [],
    loader,
    trailingSlash = "preserve",
    defaultChangefreq,
    defaultPriority,
    dedupe = true,
  } = options;

  if (!site || !site.trim()) {
    throw new Error("[web-sitemap] `site` option is required (e.g. 'https://example.com').");
  }

  const dynamicInputs = loader ? await loader() : [];
  const allInputs = [...urls, ...dynamicInputs];

  const entriesMap = new Map<string, SitemapEntry>();
  const entriesList: SitemapEntry[] = [];

  for (const raw of allInputs) {
    const entry = toSitemapEntry(raw);
    if (!entry.loc || !entry.loc.trim()) continue;

    const normalizedLoc = normalizeUrl(site, entry.loc, trailingSlash);
    const normalizedEntry: SitemapEntry = {
      ...entry,
      loc: normalizedLoc,
    };

    if (dedupe) {
      entriesMap.set(normalizedLoc, normalizedEntry);
    } else {
      entriesList.push(normalizedEntry);
    }
  }

  const finalEntries = dedupe ? Array.from(entriesMap.values()) : entriesList;

  const urlBlocks = finalEntries.map((entry) => {
    const lines: string[] = [`  <url>`, `    <loc>${escapeXml(entry.loc)}</loc>`];

    const lastmod = formatDate(entry.lastmod);
    if (lastmod) {
      lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
    }

    const changefreq = formatChangefreq(entry.changefreq ?? defaultChangefreq);
    if (changefreq) {
      lines.push(`    <changefreq>${changefreq}</changefreq>`);
    }

    const priority = formatPriority(entry.priority ?? defaultPriority);
    if (priority) {
      lines.push(`    <priority>${priority}</priority>`);
    }

    lines.push(`  </url>`);
    return lines.join("\n");
  });

  const body = urlBlocks.length > 0 ? `\n${urlBlocks.join("\n")}\n` : "\n";

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>\n`;
}

/**
 * Generates an XML sitemap and returns a Web Standard `Response` object ready
 * to be returned from any handler (Cloudflare Workers, Hono, Astro, Next.js, SvelteKit, Deno, Bun).
 */
export async function createSitemapResponse(
  options: SitemapOptions,
): Promise<Response> {
  const xml = await renderSitemap(options);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": options.cacheControl ?? DEFAULT_CACHE_CONTROL,
      ...options.headers,
    },
  });
}

/**
 * Generates a pure XML Sitemap Index string (`<sitemapindex>`).
 */
export function renderSitemapIndex(options: SitemapIndexOptions): string {
  const { site, sitemaps } = options;

  if (!site || !site.trim()) {
    throw new Error("[web-sitemap] `site` option is required (e.g. 'https://example.com').");
  }

  const blocks: string[] = [];

  for (const raw of sitemaps) {
    const entry = toSitemapIndexEntry(raw);
    if (!entry.loc || !entry.loc.trim()) continue;

    const normalizedLoc = normalizeUrl(site, entry.loc, "preserve");
    const lines: string[] = [
      `  <sitemap>`,
      `    <loc>${escapeXml(normalizedLoc)}</loc>`,
    ];

    const lastmod = formatDate(entry.lastmod);
    if (lastmod) {
      lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
    }

    lines.push(`  </sitemap>`);
    blocks.push(lines.join("\n"));
  }

  const body = blocks.length > 0 ? `\n${blocks.join("\n")}\n` : "\n";

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>\n`;
}

/**
 * Generates an XML Sitemap Index and returns a Web Standard `Response` object.
 */
export function createSitemapIndexResponse(
  options: SitemapIndexOptions,
): Response {
  const xml = renderSitemapIndex(options);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": options.cacheControl ?? DEFAULT_CACHE_CONTROL,
      ...options.headers,
    },
  });
}
