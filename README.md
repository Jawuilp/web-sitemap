# web-sitemap

Zero-dependency, **Web Standards-based** dynamic XML sitemap generator for any JavaScript runtime (**Cloudflare Workers**, **Hono**, **Astro SSR**, **Next.js**, **SvelteKit**, **Nuxt**, **Remix**, **Bun**, **Deno**, and **Node.js**).

## Why `web-sitemap`?

1. **Built on Web Standards (`Response`, `Headers`, `URL`)**: Does not use `node:stream`, `fs`, or Node-specific APIs. Runs natively in any V8 / WinterCG runtime.
2. **Made for Dynamic / SSR Sites**: Fetch your blog posts, products, or routes from your database (Turso, D1, Postgres, Convex, Supabase) at request time without having to trigger a full site rebuild for every new post.
3. **Never Breaks Browser XML Viewers**: Emits pure, strict `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` without `xmlns:xhtml` namespace conflicts or deprecated XSLT directives that break Chrome's native XML tree viewer.
4. **Automatic Sanitization & Normalization**: Handles XML entity escaping, `trailingSlash` policies (`"always" | "never" | "preserve"`), `YYYY-MM-DD` date formatting, URL deduplication, and `nosniff` headers automatically.

---

## Installation

```bash
npm install web-sitemap
# or
pnpm add web-sitemap
# or
bun add web-sitemap
```

---

## Usage Examples

### 1. Astro SSR (`src/pages/sitemap.xml.ts`)

```ts
import type { APIRoute } from "astro";
import { createSitemapResponse } from "web-sitemap";

export const prerender = false;

export const GET: APIRoute = async () => {
  return createSitemapResponse({
    site: "https://labs.jawuil.dev",
    trailingSlash: "always",
    urls: [
      { loc: "/", changefreq: "weekly", priority: 1.0 },
      { loc: "/about", changefreq: "monthly", priority: 0.8 },
      { loc: "/blog", changefreq: "weekly", priority: 0.9 },
    ],
    loader: async () => {
      const posts = await fetchPostsFromDB();
      return posts.map((post) => ({
        loc: `/blog/${post.slug}`,
        lastmod: post.pubDate,
        changefreq: "weekly",
        priority: 0.7,
      }));
    },
  });
};
```

### 2. Hono / Cloudflare Workers

```ts
import { Hono } from "hono";
import { createSitemapResponse } from "web-sitemap";

const app = new Hono();

app.get("/sitemap.xml", async (c) => {
  return createSitemapResponse({
    site: "https://example.com",
    trailingSlash: "always",
    urls: ["/", "/pricing", "/docs"],
    loader: async () => {
      const articles = await getArticles(c.env.DB);
      return articles.map((a) => ({
        loc: `/blog/${a.slug}`,
        lastmod: a.updatedAt,
      }));
    },
  });
});

export default app;
```

### 3. Next.js App Router / SvelteKit / Remix

```ts
import { createSitemapResponse } from "web-sitemap";

export async function GET() {
  return createSitemapResponse({
    site: "https://example.com",
    urls: ["/", "/about"],
  });
}
```

### 4. Raw XML String (`renderSitemap`)

If you only want the generated XML string:

```ts
import { renderSitemap } from "web-sitemap";

const xml = await renderSitemap({
  site: "https://example.com",
  urls: ["/", "/contact"],
});
```

### 5. Sitemap Index (`createSitemapIndexResponse`)

```ts
import { createSitemapIndexResponse } from "web-sitemap";

export async function GET() {
  return createSitemapIndexResponse({
    site: "https://example.com",
    sitemaps: [
      { loc: "/sitemap-pages.xml", lastmod: new Date() },
      { loc: "/sitemap-blog.xml", lastmod: new Date() },
    ],
  });
}
```

---

## License

MIT © [Jawuil Labs](https://labs.jawuil.dev)
