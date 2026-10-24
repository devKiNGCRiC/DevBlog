// ============================================================
// models/Report.model.js — A user flagging a post or comment
//
// Reports land in the admin dashboard's "Reports" tab, where an admin
// either removes the content ("resolved") or keeps it ("dismissed").
// ============================================================

const mongoose = require("mongoose");

const REPORT_REASONS = ["spam", "harassment", "inappropriate", "misinformation", "other"];

const reportSchema = new mongoose.Schema(
    {
        // Who flagged it
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // The reported post — or, for a comment report, the post the comment is on
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true,
        },

        // Set only when a COMMENT is being reported
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
        },

        reason: {
            type: String,
            enum: REPORT_REASONS,
            required: [true, "Please choose a reason"],
        },

        details: {
            type: String,
            trim: true,
            maxlength: [500, "Details cannot be more than 500 characters"],
            default: "",
        },

        status: {
            type: String,
            enum: ["open", "resolved", "dismissed"],
            default: "open",
        },

        // The admin who handled it
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

// A user can report the same post/comment only once
reportSchema.index({ reporter: 1, post: 1, comment: 1 }, { unique: true });
reportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.model("Report", reportSchema);
Report.REASONS = REPORT_REASONS;
module.exports = Report;
