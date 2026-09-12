// ============================================================
// routes/auth.routes.js — Authentication Routes
//
// Routes are like a map. They say:
// "When someone sends a request to THIS URL, call THIS function"
//
// Example: POST /api/auth/register → calls register() in auth.controller.js
// ============================================================

const express = require("express");
const router = express.Router(); // Router is like a mini Express app for grouping routes

// Import controller functions
const {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
} = require("../controllers/auth.controller");

// Import middlewares
const { protect } = require("../middleware/auth.middleware"); // JWT protection
const upload = require("../middleware/upload.middleware"); // File upload handler

// Public routes (no login required)
router.post("/register", register); // POST /api/auth/register
router.post("/login", login); // POST /api/auth/login
router.get("/verify-email", verifyEmail); // GET /api/auth/verify-email?token=...
router.post("/forgot-password", forgotPassword); // POST /api/auth/forgot-password
router.post("/reset-password", resetPassword); // POST /api/auth/reset-password

// Private routes (must be logged in)
// "protect" middleware runs first, then the controller function
router.get("/me", protect, getMe); // GET /api/auth/me
router.put(
    "/profile",
    protect,
    upload.fields([
        { name: "profilePicture", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    updateProfile
); // PUT /api/auth/profile
router.put("/change-password", protect, changePassword); // PUT /api/auth/change-password
router.post("/resend-verification", protect, resendVerification); // POST /api/auth/resend-verification

module.exports = router;
