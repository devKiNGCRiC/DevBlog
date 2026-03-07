// ============================================================
// routes/comment-standalone.routes.js — Standalone Comment Routes
//
// These routes handle individual comment operations (not nested under a post).
// Mounted at /api/comments in server.js.
// Full paths:
//   DELETE /api/comments/:id        — delete a comment
//   POST   /api/comments/:id/like   — like/unlike a comment
// ============================================================

const express = require("express");
const router = express.Router();

const { deleteComment, likeComment } = require("../controllers/comment.controller");
const { protect } = require("../middleware/auth.middleware");

router.delete("/:id", protect, deleteComment);     // DELETE /api/comments/:id
router.post("/:id/like", protect, likeComment);    // POST   /api/comments/:id/like

module.exports = router;
