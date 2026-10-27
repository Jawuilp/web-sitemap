export {
  createSitemapIndexResponse,
  createSitemapResponse,
  renderSitemap,
  renderSitemapIndex,
} from "./sitemap";

export {
  escapeXml,
  formatChangefreq,
  formatDate,
  formatPriority,
  normalizeUrl,
} from "./xml";

export type {
  ChangeFreq,
  SitemapEntry,
  SitemapIndexEntry,
  SitemapIndexInput,
  SitemapIndexOptions,
  SitemapInput,
  SitemapOptions,
  TrailingSlashPolicy,
} from "./types";
