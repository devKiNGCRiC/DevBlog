// ============================================================
// routes/admin.routes.js — Admin Moderation Routes
//
// Every route in this file is admin-only. We apply "protect" (must be
// logged in) and "adminOnly" (must have role: 'admin') to the whole
// router at once with router.use(), instead of repeating both
// middlewares on every single route below.
// ============================================================

const express = require("express");
const router = express.Router();

const {
    getStats,
    getAllPostsAdmin,
    deletePostAdmin,
    getAllCommentsAdmin,
    deleteCommentAdmin,
    getAllUsersAdmin,
    updateUserRole,
    deleteUserAdmin,
    getReportsAdmin,
    reviewReport,
} = require("../controllers/admin.controller");

const { protect, adminOnly } = require("../middleware/auth.middleware");

// Applies to every route defined below this line
router.use(protect, adminOnly);

router.get("/stats", getStats); // GET /api/admin/stats

router.get("/posts", getAllPostsAdmin); // GET /api/admin/posts
router.delete("/posts/:id", deletePostAdmin); // DELETE /api/admin/posts/:id

router.get("/comments", getAllCommentsAdmin); // GET /api/admin/comments
router.delete("/comments/:id", deleteCommentAdmin); // DELETE /api/admin/comments/:id

router.get("/users", getAllUsersAdmin); // GET /api/admin/users
router.put("/users/:id/role", updateUserRole); // PUT /api/admin/users/:id/role
router.delete("/users/:id", deleteUserAdmin); // DELETE /api/admin/users/:id
router.get("/reports", getReportsAdmin); // GET /api/admin/reports?status=open
router.put("/reports/:id", reviewReport); // PUT /api/admin/reports/:id { action }

module.exports = router;
