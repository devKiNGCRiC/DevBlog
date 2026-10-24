// ============================================================
// models/PostView.model.js — "Who has viewed this post recently?"
//
// Without this, every page refresh added +1 to a post's views.
// Now each viewer leaves one small record per post. While that
// record exists, repeat visits are not counted again.
// MongoDB deletes the record automatically after 24 hours (TTL index),
// so the same person counts again the next day.
// ============================================================

const mongoose = require("mongoose");

const VIEW_WINDOW_SECONDS = 24 * 60 * 60; // 24 hours

const postViewSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },

    // "user:<id>" for logged-in readers, "ip:<hash>" for guests.
    // Guest IPs are hashed so we never store a raw IP address.
    viewerKey: {
        type: String,
        required: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
        expires: VIEW_WINDOW_SECONDS, // TTL index: auto-delete after 24h
    },
});

// One record per viewer per post — a second insert fails with a duplicate-key error
postViewSchema.index({ post: 1, viewerKey: 1 }, { unique: true });

const PostView = mongoose.model("PostView", postViewSchema);
module.exports = PostView;
