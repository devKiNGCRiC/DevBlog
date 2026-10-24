// ============================================================
// controllers/series.controller.js — Post Series Logic
//
// Authors group posts into ordered series ("Part 1 of 5").
// Posts are added to a series from the post editor (post.controller.js);
// this file manages the series themselves.
// ============================================================

const Series = require("../models/Series.model");
const Post = require("../models/Post.model");

// ============================================================
// @desc    Get my series (for the editor's "Series" dropdown)
// @route   GET /api/series/mine
// @access  Private
// ============================================================
const getMySeries = async (req, res) => {
    const series = await Series.find({ author: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, series });
};

// ============================================================
// @desc    Create a series
// @route   POST /api/series
// @access  Private
// ============================================================
const createSeries = async (req, res) => {
    const { title, description } = req.body;
    if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ success: false, message: "Series title is required" });
    }
    const series = await Series.create({
        title,
        description: typeof description === "string" ? description : "",
        author: req.user._id,
    });
    res.status(201).json({ success: true, series });
};

// ============================================================
// @desc    Get a series and its published parts, in order
// @route   GET /api/series/:id
// @access  Public
// ============================================================
const getSeries = async (req, res) => {
    const series = await Series.findById(req.params.id).populate("author", "name username profilePicture");
    if (!series) {
        return res.status(404).json({ success: false, message: "Series not found" });
    }
    const posts = await Post.find({ series: series._id, ...Post.liveFilter() })
        .sort({ seriesOrder: 1 })
        .select("title slug excerpt seriesOrder readTime publishedAt");

    res.status(200).json({ success: true, series, posts });
};

// ============================================================
// @desc    Delete a series (its posts are kept, just no longer grouped)
// @route   DELETE /api/series/:id
// @access  Private (owner or admin)
// ============================================================
const deleteSeries = async (req, res) => {
    const series = await Series.findById(req.params.id);
    if (!series) {
        return res.status(404).json({ success: false, message: "Series not found" });
    }
    if (series.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "You are not allowed to delete this series" });
    }

    await Post.updateMany({ series: series._id }, { series: null, seriesOrder: null });
    await series.deleteOne();

    res.status(200).json({ success: true, message: "Series deleted" });
};

module.exports = { getMySeries, createSeries, getSeries, deleteSeries };
