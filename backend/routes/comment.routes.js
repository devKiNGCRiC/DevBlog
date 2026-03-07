// ============================================================
// routes/comment.routes.js — Comment Routes (nested under posts)
//
// Mounted at /api/posts in server.js.
// Full paths:
//   POST /api/posts/:postId/comments  — add a comment to a post
//   GET  /api/posts/:postId/comments  — get all comments for a post (public)
//
// Standalone comment operations (delete/like) live in comment-standalone.routes.js
// ============================================================

const express = require("express");
const router = express.Router();

const { addComment, getComments } = require("../controllers/comment.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/:postId/comments", protect, addComment); // POST /api/posts/:postId/comments
router.get("/:postId/comments", getComments);          // GET  /api/posts/:postId/comments (public)

module.exports = router;
