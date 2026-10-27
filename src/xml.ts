import type { ChangeFreq, TrailingSlashPolicy } from "./types";

const XML_ENTITIES: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};

const VALID_CHANGEFREQS = new Set<string>([
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
]);

/**
 * Escapes the 5 reserved XML characters required by sitemaps.org specification.
 */
export function escapeXml(value: unknown): string {
  return String(value ?? "").replace(/[<>&'"]/g, (char) => XML_ENTITIES[char]!);
}

/**
 * Resolves a relative path or full URL against a base `site` origin using Web Standard `URL`
 * and applies the requested `trailingSlash` policy.
 */
export function normalizeUrl(
  site: string,
  loc: string,
  trailingSlash: TrailingSlashPolicy = "preserve",
): string {
  const trimmedBase = site.trim().replace(/\/+$/, "");
  const trimmedLoc = loc.trim();

  const resolved = /^https?:\/\//i.test(trimmedLoc)
    ? new URL(trimmedLoc)
    : new URL(
        trimmedLoc.startsWith("/") ? trimmedLoc : `/${trimmedLoc}`,
        `${trimmedBase}/`,
      );

  // Do not force trailing slash on file extensions like .xml, .pdf, .html
  const hasFileExtension = /\.[a-z0-9]{2,5}$/i.test(resolved.pathname);

  if (!hasFileExtension) {
    if (trailingSlash === "always" && !resolved.pathname.endsWith("/")) {
      resolved.pathname = `${resolved.pathname}/`;
    } else if (
      trailingSlash === "never" &&
      resolved.pathname.length > 1 &&
      resolved.pathname.endsWith("/")
    ) {
      resolved.pathname = resolved.pathname.replace(/\/+$/, "");
    }
  }

  return resolved.toString();
}

/**
 * Formats a `Date`, ISO string, or timestamp into `YYYY-MM-DD` (W3C Datetime format).
 * Returns `null` if the input is nullish or an invalid date, preventing broken `<lastmod>` tags.
 */
export function formatDate(
  value: Date | string | number | null | undefined,
): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  // If already a valid YYYY-MM-DD string, return directly
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return d.toISOString().split("T")[0]!;
}

/**
 * Validates and formats a sitemap priority between `0.0` and `1.0`.
 */
export function formatPriority(
  priority: number | string | undefined,
): string | null {
  if (priority === undefined || priority === null || priority === "") {
    return null;
  }

  const num = typeof priority === "number" ? priority : Number(priority);
  if (Number.isNaN(num)) {
    return null;
  }

  const clamped = Math.min(1, Math.max(0, num));
  return clamped.toFixed(1);
}

/**
 * Validates a `<changefreq>` value against the sitemaps.org specification.
 */
export function formatChangefreq(
  freq: ChangeFreq | string | undefined,
): ChangeFreq | null {
  if (!freq) return null;
  const normalized = freq.trim().toLowerCase();
  return VALID_CHANGEFREQS.has(normalized) ? (normalized as ChangeFreq) : null;
}
