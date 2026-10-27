/**
 * Valid `<changefreq>` values defined by the sitemaps.org 0.9 specification.
 */
export type ChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

/**
 * Policy for normalizing trailing slashes on sitemap URLs.
 * - `"always"`: Ensures every URL ends with `/` (e.g. `https://example.com/blog/`)
 * - `"never"`: Strips trailing slashes except on the root path `/` (e.g. `https://example.com/blog`)
 * - `"preserve"`: Leaves paths as provided (default)
 */
export type TrailingSlashPolicy = "always" | "never" | "preserve";

/**
 * A single `<url>` entry in the sitemap.
 */
export interface SitemapEntry {
  /**
   * Relative path (e.g. `"/blog/my-post"`) or absolute URL (e.g. `"https://example.com/blog/my-post"`).
   */
  loc: string;
  /**
   * Last modification date. Accepts a `Date`, ISO string, or Unix timestamp (ms).
   * Invalid dates are safely ignored rather than emitting malformed XML.
   */
  lastmod?: Date | string | number | null;
  /**
   * How frequently the page is likely to change.
   */
  changefreq?: ChangeFreq;
  /**
   * The priority of this URL relative to other URLs on your site (0.0 to 1.0).
   */
  priority?: number | string;
}

/**
 * Input item that can be either a plain URL/path string or a full `SitemapEntry` object.
 */
export type SitemapInput = string | SitemapEntry;

/**
 * Options for generating a standard XML sitemap (`<urlset>`).
 */
export interface SitemapOptions {
  /**
   * Base origin URL of your website (e.g. `"https://labs.jawuil.dev"`).
   */
  site: string;
  /**
   * Static paths or entries to include in the sitemap.
   */
  urls?: SitemapInput[];
  /**
   * Optional synchronous or asynchronous loader function to fetch dynamic entries
   * at request time (e.g. from Turso, LibSQL, D1, Postgres, Convex, or a CMS).
   */
  loader?: () => Promise<SitemapInput[]> | SitemapInput[];
  /**
   * Trailing slash normalization policy across all generated URLs.
   * @default "preserve"
   */
  trailingSlash?: TrailingSlashPolicy;
  /**
   * Default `<changefreq>` applied to entries that do not specify one.
   */
  defaultChangefreq?: ChangeFreq;
  /**
   * Default `<priority>` applied to entries that do not specify one.
   */
  defaultPriority?: number | string;
  /**
   * Automatically deduplicate URLs based on their final normalized `<loc>`.
   * When duplicates exist, later entries override earlier ones.
   * @default true
   */
  dedupe?: boolean;
  /**
   * `Cache-Control` HTTP header value when returning a `Response`.
   * @default "public, max-age=0, must-revalidate"
   */
  cacheControl?: string;
  /**
   * Additional custom HTTP headers to attach to the `Response`.
   */
  headers?: Record<string, string>;
}

/**
 * A single `<sitemap>` entry inside a `<sitemapindex>`.
 */
export interface SitemapIndexEntry {
  /**
   * Relative path (e.g. `"/sitemap-blog.xml"`) or absolute URL to a sub-sitemap.
   */
  loc: string;
  /**
   * Last modification date of the sub-sitemap.
   */
  lastmod?: Date | string | number | null;
}

export type SitemapIndexInput = string | SitemapIndexEntry;

/**
 * Options for generating a Sitemap Index (`<sitemapindex>`).
 */
export interface SitemapIndexOptions {
  /**
   * Base origin URL of your website.
   */
  site: string;
  /**
   * List of sub-sitemap URLs or entries.
   */
  sitemaps: SitemapIndexInput[];
  /**
   * `Cache-Control` HTTP header value when returning a `Response`.
   * @default "public, max-age=0, must-revalidate"
   */
  cacheControl?: string;
  /**
   * Additional custom HTTP headers to attach to the `Response`.
   */
  headers?: Record<string, string>;
}
