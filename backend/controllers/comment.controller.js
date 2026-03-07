// ============================================================
// controllers/comment.controller.js — Comment Logic
//
// Handles adding, reading, deleting, and liking comments.
// Also handles nested comments (replies to comments).
// ============================================================

const Comment = require("../models/Comment.model");
const Post = require("../models/Post.model");

// ============================================================
// @desc    Add a comment to a post
// @route   POST /api/posts/:postId/comments
// @access  Private
// ============================================================
const addComment = async (req, res) => {
    const { content, parentCommentId } = req.body;
    const { postId } = req.params;

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
        return res.status(404).json({
            success: false,
            message: "Post not found",
        });
    }

    // Create the comment
    const comment = await Comment.create({
        content,
        author: req.user._id, // The logged-in user is the comment author
        post: postId, // Which post is this comment on?
        parentComment: parentCommentId || null, // null = top-level, ID = reply
    });

    // Populate author info before sending response
    const populatedComment = await Comment.findById(comment._id).populate(
        "author",
        "name username profilePicture"
    );

    res.status(201).json({
        success: true,
        message: "Comment added!",
        comment: populatedComment,
    });
};

// ============================================================
// @desc    Get all comments for a post (nested structure)
// @route   GET /api/posts/:postId/comments
// @access  Public
// ============================================================
const getComments = async (req, res) => {
    const { postId } = req.params;

    // Fetch ALL comments for this post in a SINGLE query (fixes N+1 problem)
    // Then group them in memory into a tree structure
    const allComments = await Comment.find({
        post: postId,
        isDeleted: false,
    })
        .populate("author", "name username profilePicture")
        .sort({ createdAt: 1 }); // Oldest first — chronological order

    // Build a map and group replies under their parent
    const commentMap = {};
    const topLevel = [];

    // First pass: index every comment by ID
    allComments.forEach((c) => {
        commentMap[c._id.toString()] = { ...c.toObject(), replies: [] };
    });

    // Second pass: attach each comment to its parent or to the top-level list
    allComments.forEach((c) => {
        if (!c.parentComment) {
            // No parent — it's a root comment
            topLevel.push(commentMap[c._id.toString()]);
        } else {
            // Has a parent — attach it as a reply (handles unlimited nesting depth)
            const parent = commentMap[c.parentComment.toString()];
            if (parent) {
                parent.replies.push(commentMap[c._id.toString()]);
            } else {
                // Orphaned reply (parent was hard-deleted) — show at top level
                topLevel.push(commentMap[c._id.toString()]);
            }
        }
    });

    res.status(200).json({
        success: true,
        comments: topLevel,
        totalComments: allComments.length,
    });
};

// ============================================================
// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private (only comment author or admin)
// ============================================================
const deleteComment = async (req, res) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        return res.status(404).json({
            success: false,
            message: "Comment not found",
        });
    }

    // Only comment author or admin can delete
    if (
        comment.author.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
    ) {
        return res.status(403).json({
            success: false,
            message: "You are not allowed to delete this comment",
        });
    }

    // "Soft delete" — we mark it as deleted but keep the record
    // This way, replies still have a parent to reference
    comment.isDeleted = true;
    comment.content = "[This comment has been deleted]";
    await comment.save();

    res.status(200).json({
        success: true,
        message: "Comment deleted",
    });
};

// ============================================================
// @desc    Like or Unlike a comment (toggle)
// @route   POST /api/comments/:id/like
// @access  Private
// ============================================================
const likeComment = async (req, res) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        return res.status(404).json({
            success: false,
            message: "Comment not found",
        });
    }

    // Check if already liked
    const alreadyLiked = comment.likes.some(
        (id) => id.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
        // Remove like
        await Comment.findByIdAndUpdate(req.params.id, {
            $pull: { likes: req.user._id },
        });
        return res.status(200).json({ success: true, liked: false });
    } else {
        // Add like
        await Comment.findByIdAndUpdate(req.params.id, {
            $addToSet: { likes: req.user._id },
        });
        return res.status(200).json({ success: true, liked: true });
    }
};

module.exports = { addComment, getComments, deleteComment, likeComment };
