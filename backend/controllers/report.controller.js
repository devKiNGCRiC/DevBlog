// ============================================================
// controllers/report.controller.js — Users flagging content
//
// Reviewing reports is admin-only and lives in admin.controller.js.
// ============================================================

const mongoose = require("mongoose");
const Report = require("../models/Report.model");
const Post = require("../models/Post.model");
const Comment = require("../models/Comment.model");

// ============================================================
// @desc    Report a post or a comment
// @route   POST /api/reports
// @body    { targetType: "post" | "comment", targetId, reason, details? }
// @access  Private
// ============================================================
const createReport = async (req, res) => {
    const { targetType, targetId, reason, details } = req.body;

    if (!["post", "comment"].includes(targetType) || typeof targetId !== "string" || !mongoose.isValidObjectId(targetId)) {
        return res.status(400).json({ success: false, message: "Invalid report target" });
    }
    if (!Report.REASONS.includes(reason)) {
        return res.status(400).json({ success: false, message: "Please choose a valid reason" });
    }

    // Find what's being reported, and who wrote it
    let postId;
    let commentId = null;
    let authorId;
    if (targetType === "post") {
        const post = await Post.findById(targetId).select("author");
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });
        postId = post._id;
        authorId = post.author;
    } else {
        const comment = await Comment.findOne({ _id: targetId, isDeleted: false }).select("author post");
        if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });
        postId = comment.post;
        commentId = comment._id;
        authorId = comment.author;
    }

    if (authorId.toString() === req.user._id.toString()) {
        return res.status(400).json({ success: false, message: "You can't report your own content" });
    }

    const already = await Report.exists({ reporter: req.user._id, post: postId, comment: commentId });
    if (already) {
        return res.status(409).json({ success: false, message: "You've already reported this" });
    }

    await Report.create({
        reporter: req.user._id,
        post: postId,
        comment: commentId,
        reason,
        details: typeof details === "string" ? details : "",
    });

    res.status(201).json({ success: true, message: "Thanks — a moderator will review it." });
};

module.exports = { createReport };
