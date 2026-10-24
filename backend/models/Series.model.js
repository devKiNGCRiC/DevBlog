// ============================================================
// models/Series.model.js — A named, ordered collection of posts
//
// Example: "Learning Node.js" → Part 1, Part 2, Part 3...
// Posts point at their series (Post.series) and know their
// position in it (Post.seriesOrder).
// ============================================================

const mongoose = require("mongoose");

const seriesSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Series title is required"],
            trim: true,
            maxlength: [100, "Series title cannot be more than 100 characters"],
        },

        description: {
            type: String,
            trim: true,
            maxlength: [300, "Series description cannot be more than 300 characters"],
            default: "",
        },

        // Only the author can add their posts to this series
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

seriesSchema.index({ author: 1 });

const Series = mongoose.model("Series", seriesSchema);
module.exports = Series;
