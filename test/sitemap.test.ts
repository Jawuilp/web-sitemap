import { describe, expect, it } from "vitest";
import {
  createSitemapIndexResponse,
  createSitemapResponse,
  escapeXml,
  formatDate,
  normalizeUrl,
  renderSitemap,
  renderSitemapIndex,
} from "../src/index";

describe("web-sitemap", () => {
  it("emits pure sitemaps.org 0.9 XML without xmlns:xhtml or XSLT", async () => {
    const xml = await renderSitemap({
      site: "https://labs.jawuil.dev",
      trailingSlash: "always",
      urls: [
        { loc: "/", changefreq: "weekly", priority: 1.0 },
        { loc: "/es", changefreq: "weekly", priority: 1.0 },
      ],
    });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(xml).not.toContain("xmlns:xhtml");
    expect(xml).not.toContain("xml-stylesheet");
    expect(xml).toContain("<loc>https://labs.jawuil.dev/</loc>");
    expect(xml).toContain("<loc>https://labs.jawuil.dev/es/</loc>");
    expect(xml).toContain("<priority>1.0</priority>");
  });

  it("merges static urls with async database loader entries", async () => {
    const xml = await renderSitemap({
      site: "https://labs.jawuil.dev",
      trailingSlash: "always",
      urls: ["/"],
      loader: async () => [
        {
          loc: "/blog/post-1",
          lastmod: new Date("2026-10-24T12:00:00Z"),
          changefreq: "weekly",
          priority: 0.7,
        },
      ],
    });

    expect(xml).toContain("<loc>https://labs.jawuil.dev/</loc>");
    expect(xml).toContain("<loc>https://labs.jawuil.dev/blog/post-1/</loc>");
    expect(xml).toContain("<lastmod>2026-10-24</lastmod>");
    expect(xml).toContain("<changefreq>weekly</changefreq>");
    expect(xml).toContain("<priority>0.7</priority>");
  });

  it("normalizes trailing slashes according to policy", () => {
    expect(normalizeUrl("https://example.com", "/about", "always")).toBe(
      "https://example.com/about/",
    );
    expect(normalizeUrl("https://example.com", "/about/", "never")).toBe(
      "https://example.com/about",
    );
    expect(normalizeUrl("https://example.com", "/", "never")).toBe(
      "https://example.com/",
    );
    expect(
      normalizeUrl("https://example.com", "/sitemap.xml", "always"),
    ).toBe("https://example.com/sitemap.xml");
  });

  it("escapes XML special characters in URLs", () => {
    expect(escapeXml("https://example.com/?a=1&b=2")).toBe(
      "https://example.com/?a=1&amp;b=2",
    );
  });

  it("safely ignores invalid dates instead of emitting malformed XML", () => {
    expect(formatDate("not-a-date")).toBeNull();
    expect(formatDate(null)).toBeNull();
    expect(formatDate("2026-10-27")).toBe("2026-10-27");
  });

  it("deduplicates URLs by normalized loc", async () => {
    const xml = await renderSitemap({
      site: "https://example.com",
      trailingSlash: "always",
      urls: [
        { loc: "/blog", priority: 0.5 },
        { loc: "/blog/", priority: 0.9 },
      ],
    });

    const matches = xml.match(/<loc>https:\/\/example\.com\/blog\/<\/loc>/g);
    expect(matches).toHaveLength(1);
    expect(xml).toContain("<priority>0.9</priority>");
  });

  it("returns a Web Standard Response with safe XML headers", async () => {
    const response = await createSitemapResponse({
      site: "https://labs.jawuil.dev",
      urls: ["/"],
    });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/xml");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=0, must-revalidate",
    );

    const body = await response.text();
    expect(body).toContain("<loc>https://labs.jawuil.dev/</loc>");
  });

  it("generates a valid Sitemap Index Response", async () => {
    const response = createSitemapIndexResponse({
      site: "https://labs.jawuil.dev",
      sitemaps: [
        { loc: "/sitemap-static.xml", lastmod: "2026-10-27" },
        "/sitemap-blog.xml",
      ],
    });

    expect(response.status).toBe(200);
    const xml = await response.text();
    expect(xml).toContain(
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(xml).toContain(
      "<loc>https://labs.jawuil.dev/sitemap-static.xml</loc>",
    );
    expect(xml).toContain(
      "<loc>https://labs.jawuil.dev/sitemap-blog.xml</loc>",
    );
  });
});
