// ============================================================
// routes/post.routes.js — Blog Post Routes
// ============================================================

const express = require("express");
const router = express.Router();

const {
    createPost,
    getAllPosts,
    getPostBySlug,
    getPostById,
    getMyPosts,
    updatePost,
    deletePost,
    likePost,
    bookmarkPost,
    getBookmarkedPosts,
    getCategories,
    getRelatedPosts,
} = require("../controllers/post.controller");

const { protect, optionalAuth } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

// Public routes
router.get("/", optionalAuth, getAllPosts); // GET /api/posts (with ?page, ?search, ?category, ?tag, ?feed=following)
router.get("/categories", getCategories); // GET /api/posts/categories — distinct category list
router.get("/slug/:slug", getPostBySlug); // GET /api/posts/slug/my-first-post
router.get("/:id/related", getRelatedPosts); // GET /api/posts/:id/related — up to 3 similar posts
router.get("/id/:id", protect, getPostById); // GET /api/posts/id/:id (for edit mode — requires auth)

// Private routes
router.get("/my-posts", protect, getMyPosts); // GET /api/posts/my-posts
router.get("/bookmarks", protect, getBookmarkedPosts); // GET /api/posts/bookmarks
router.post(
    "/",
    protect,
    upload.single("coverImage"), // Accept one file: the cover image
    createPost
); // POST /api/posts

router.put(
    "/:id",
    protect,
    upload.single("coverImage"),
    updatePost
); // PUT /api/posts/:id
router.delete("/:id", protect, deletePost); // DELETE /api/posts/:id
router.post("/:id/like", protect, likePost); // POST /api/posts/:id/like
router.post("/:id/bookmark", protect, bookmarkPost); // POST /api/posts/:id/bookmark

module.exports = router;
