// ============================================================
// controllers/feed.controller.js — RSS feed and XML sitemap
//
// RSS lets readers follow DevBlog in a feed reader (Feedly, NetNewsWire...).
// The sitemap tells search engines which pages exist.
//
// Links point at the FRONTEND (CLIENT_URL), since that's where
// people actually read posts — the API just generates the XML.
// ============================================================

const Post = require("../models/Post.model");

const RSS_ITEM_COUNT = 20;

const siteUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");

// Make text safe to put inside XML (titles can contain & < > " ')
const escapeXml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

// ============================================================
// @desc    RSS 2.0 feed of the latest published posts
// @route   GET /api/feed/rss.xml
// @access  Public
// ============================================================
const getRssFeed = async (req, res) => {
    const site = siteUrl();
    const posts = await Post.find(Post.liveFilter())
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(RSS_ITEM_COUNT)
        .populate("author", "name")
        .select("title slug excerpt categories tags publishedAt createdAt author");

    const items = posts
        .map((post) => {
            const link = `${site}/post/${post.slug}`;
            const categories = [...post.categories, ...post.tags]
                .map((c) => `      <category>${escapeXml(c)}</category>`)
                .join("\n");
            return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${new Date(post.publishedAt || post.createdAt).toUTCString()}</pubDate>
      <dc:creator>${escapeXml(post.author?.name || "DevBlog")}</dc:creator>
      <description>${escapeXml(post.excerpt)}</description>
${categories}
    </item>`;
        })
        .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DevBlog</title>
    <link>${escapeXml(site)}</link>
    <description>Tutorials, insights, and ideas from developers worldwide.</description>
    <language>en</language>
    <atom:link href="${escapeXml(`${req.protocol}://${req.get("host")}${req.originalUrl}`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

    res.set("Cache-Control", "public, max-age=900"); // Feed readers may cache for 15 minutes
    res.type("application/rss+xml").send(xml);
};

// ============================================================
// @desc    XML sitemap: static pages, every live post, and every author profile
// @route   GET /api/feed/sitemap.xml
// @access  Public
// ============================================================
const getSitemap = async (req, res) => {
    const site = siteUrl();
    const posts = await Post.find(Post.liveFilter())
        .populate("author", "username")
        .select("slug updatedAt author");

    const entry = (path, lastmod) =>
        `  <url><loc>${escapeXml(site + path)}</loc>${lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : ""}</url>`;

    // Each author with at least one live post gets their profile listed once
    const authors = [...new Set(posts.map((p) => p.author?.username).filter(Boolean))];

    const urls = [
        entry("/"),
        entry("/about"),
        entry("/contact"),
        ...posts.map((p) => entry(`/post/${p.slug}`, p.updatedAt)),
        ...authors.map((username) => entry(`/profile/${username}`)),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    res.set("Cache-Control", "public, max-age=3600");
    res.type("application/xml").send(xml);
};

module.exports = { getRssFeed, getSitemap, escapeXml };
