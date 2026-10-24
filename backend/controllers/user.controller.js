// ============================================================
// controllers/user.controller.js — User Profile Logic
//
// Handles public user profiles and follow/unfollow functionality.
// ============================================================

const User = require("../models/User.model");
const Post = require("../models/Post.model");
const { notify, unnotify } = require("../utils/notify");

// ============================================================
// @desc    Get a user's public profile by username
// @route   GET /api/users/:username
// @access  Public
// ============================================================
const getUserProfile = async (req, res) => {
    // Find user by username (not by ID — username is friendlier in URLs)
    const user = await User.findOne({ username: req.params.username })
        .select("-password -email") // Don't expose password or email publicly
        .populate("followers", "name username profilePicture")
        .populate("following", "name username profilePicture");

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    // Get the user's published posts with pagination
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const posts = await Post.find({ author: user._id, ...Post.liveFilter() })
        .sort({ createdAt: -1 })
        .select("title slug excerpt coverImage views likes createdAt readTime")
        .skip(skip)
        .limit(limitNum);

    const totalPosts = await Post.countDocuments({ author: user._id, ...Post.liveFilter() });

    res.status(200).json({
        success: true,
        user,
        posts,
        postCount: totalPosts,
        followerCount: user.followers.length,
        followingCount: user.following.length,
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalPosts / limitNum),
            totalPosts,
        },
    });
};

// ============================================================
// @desc    Follow or Unfollow a user (toggle)
// @route   POST /api/users/:id/follow
// @access  Private
// ============================================================
const followUser = async (req, res) => {
    // The user to follow/unfollow
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    // Can't follow yourself!
    if (req.user._id.toString() === req.params.id) {
        return res.status(400).json({
            success: false,
            message: "You cannot follow yourself",
        });
    }

    // Check if already following
    const isFollowing = targetUser.followers.some(
        (id) => id.toString() === req.user._id.toString()
    );

    if (isFollowing) {
        // Unfollow:
        // Remove current user from target's followers list
        await User.findByIdAndUpdate(req.params.id, {
            $pull: { followers: req.user._id },
        });
        // Remove target from current user's following list
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { following: req.params.id },
        });
        await unnotify({ recipient: targetUser._id, actor: req.user._id, type: "follow" });
        return res
            .status(200)
            .json({ success: true, message: "Unfollowed", following: false });
    } else {
        // Follow:
        // Add current user to target's followers list
        await User.findByIdAndUpdate(req.params.id, {
            $addToSet: { followers: req.user._id },
        });
        // Add target to current user's following list
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { following: req.params.id },
        });
        await notify({ recipient: targetUser._id, actor: req.user._id, type: "follow" });
        return res
            .status(200)
            .json({ success: true, message: "Followed!", following: true });
    }
};

// ============================================================
// @desc    Search for users by name or username
// @route   GET /api/users/search?q=keyword
// @access  Public
// ============================================================
const searchUsers = async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({
            success: false,
            message: "Please provide a search query",
        });
    }

    // Escape special regex characters to prevent ReDoS attacks
    // A malicious query like 'a++++b' would cause catastrophic backtracking without this
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // "$regex" is MongoDB's way to do text pattern matching (like LIKE in SQL)
    // "i" flag makes it case-insensitive
    const users = await User.find({
        $or: [
            { name: { $regex: escaped, $options: "i" } },
            { username: { $regex: escaped, $options: "i" } },
        ],
    })
        .select("name username profilePicture bio") // Only send what's needed
        .limit(10); // Maximum 10 results

    res.status(200).json({
        success: true,
        users,
    });
};

module.exports = { getUserProfile, followUser, searchUsers };
