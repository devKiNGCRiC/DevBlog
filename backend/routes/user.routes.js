// ============================================================
// routes/user.routes.js — User Profile Routes
// ============================================================

const express = require("express");
const router = express.Router();

const {
    getUserProfile,
    followUser,
    searchUsers,
} = require("../controllers/user.controller");

const { protect } = require("../middleware/auth.middleware");

// Public routes
router.get("/search", searchUsers); // GET /api/users/search?q=john
router.get("/:username", getUserProfile); // GET /api/users/johndoe

// Private routes
router.post("/:id/follow", protect, followUser); // POST /api/users/:id/follow

module.exports = router;
