// ============================================================
// routes/report.routes.js — Reporting posts and comments
// (Admins review reports via /api/admin/reports)
// ============================================================

const express = require("express");
const router = express.Router();

const { createReport } = require("../controllers/report.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/", protect, createReport); // POST /api/reports

module.exports = router;
