// ============================================================
// models/Notification.model.js — "Someone did something to your stuff"
//
// One document per event a user should hear about:
//   like    — someone liked your post
//   comment — someone commented on your post
//   reply   — someone replied to your comment
//   follow  — someone started following you
// ============================================================

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        // Who should SEE this notification
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Who CAUSED it (the liker, commenter, follower...)
        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        type: {
            type: String,
            enum: ["like", "comment", "reply", "follow"],
            required: true,
        },

        // Which post it's about (not set for "follow")
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            default: null,
        },

        // The new comment/reply (only for "comment" and "reply")
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
        },

        read: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// A user's notifications, newest first — and fast unread counting
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
