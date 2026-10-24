// ============================================================
// routes/feed.routes.js — RSS feed and sitemap (public XML)
// ============================================================

const express = require("express");
const router = express.Router();

const { getRssFeed, getSitemap } = require("../controllers/feed.controller");

router.get("/rss.xml", getRssFeed); // GET /api/feed/rss.xml
router.get("/sitemap.xml", getSitemap); // GET /api/feed/sitemap.xml

module.exports = router;
