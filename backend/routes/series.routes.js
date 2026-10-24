// ============================================================
// routes/series.routes.js — Post Series Routes
// ============================================================

const express = require("express");
const router = express.Router();

const {
    getMySeries,
    createSeries,
    getSeries,
    deleteSeries,
} = require("../controllers/series.controller");

const { protect } = require("../middleware/auth.middleware");

router.get("/mine", protect, getMySeries); // GET /api/series/mine — must come before /:id
router.post("/", protect, createSeries); // POST /api/series
router.get("/:id", getSeries); // GET /api/series/:id (public)
router.delete("/:id", protect, deleteSeries); // DELETE /api/series/:id

module.exports = router;
