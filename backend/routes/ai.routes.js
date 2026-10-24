// ============================================================
// routes/ai.routes.js — AI writing assistant
// ============================================================

const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const { getAiStatus, suggestPostMetadata } = require("../controllers/ai.controller");
const { protect } = require("../middleware/auth.middleware");

// Every suggestion is a paid Claude API call, so cap it per USER (not per IP).
// Runs after "protect", so req.user is always set here.
const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 suggestions per user per hour
    keyGenerator: (req) => req.user._id.toString(),
    message: {
        success: false,
        message: "You've used the AI assistant a lot this hour. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
});

router.get("/status", protect, getAiStatus); // GET /api/ai/status
router.post("/suggest", protect, aiLimiter, suggestPostMetadata); // POST /api/ai/suggest

module.exports = router;
