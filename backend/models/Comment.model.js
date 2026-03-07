// ============================================================
// models/Comment.model.js — Comment Database Schema
//
// This handles all comments on blog posts.
// It supports NESTED comments (replies to comments)
// by storing a reference to its "parentComment".
// Think of it like a YouTube comment with a reply thread!
// ============================================================

const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        // The actual comment text written by the user
        content: {
            type: String,
            required: [true, "Comment content is required"],
            maxlength: [1000, "Comment cannot be more than 1000 characters"],
            trim: true,
        },

        // Who wrote this comment?
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Links to User model
            required: true,
        },

        // Which post is this comment on?
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post", // Links to Post model
            required: true,
        },

        // ====================================================
        // NESTED COMMENTS: parentComment
        //
        // If parentComment is NULL → this is a top-level comment
        // If parentComment has an ID → this is a REPLY to that comment
        //
        // Example structure:
        // Comment A (parentComment: null)   ← top-level
        //   └─ Comment B (parentComment: A) ← reply to A
        //      └─ Comment C (parentComment: B) ← reply to B
        // ====================================================
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment", // Links to another Comment (self-reference!)
            default: null, // null means it's a top-level comment
        },

        // Array of user IDs who liked this comment
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        // Whether this comment has been deleted
        // We use "soft delete" — we keep the record but mark it deleted
        // This way, replies still have a parent to reference
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual: Count of likes on a comment
commentSchema.virtual("likeCount").get(function () {
    return this.likes.length;
});

// Index for fast lookups
commentSchema.index({ post: 1, createdAt: -1 }); // Get all comments for a post, newest first
commentSchema.index({ parentComment: 1 }); // Get all replies to a comment

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
