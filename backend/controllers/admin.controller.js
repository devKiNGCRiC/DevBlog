// ============================================================
// controllers/admin.controller.js — Admin Moderation Logic
//
// Every function here is only reachable through routes/admin.routes.js,
// which applies "protect" + "adminOnly" middleware to the whole router.
// So by the time code runs in this file, req.user is guaranteed to be
// a logged-in admin — no need to re-check that here.
//
// This gives admins visibility into (and cleanup power over) EVERYTHING
// in the app: every post (including other users' drafts), every comment,
// and every user account — not just their own content.
// ============================================================

const User = require("../models/User.model");
const Post = require("../models/Post.model");
const Comment = require("../models/Comment.model");
const Notification = require("../models/Notification.model");
const Series = require("../models/Series.model");
const Report = require("../models/Report.model");
const PostView = require("../models/PostView.model");
const { cloudinary } = require("../config/cloudinary");

// Escape special regex characters before using user input in a $regex filter —
// same approach as user.controller.js's searchUsers (prevents ReDoS attacks).
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Remove a post and everything attached to it (cover image, comments,
// notifications, reports, view records). Shared by "delete post" and
// "remove reported content".
const removePost = async (post) => {
    if (post.coverImagePublicId) {
        await cloudinary.uploader.destroy(post.coverImagePublicId).catch(() => {});
    }
    await Promise.all([
        Comment.deleteMany({ post: post._id }),
        Notification.deleteMany({ post: post._id }),
        Report.deleteMany({ post: post._id }),
        PostView.deleteMany({ post: post._id }),
    ]);
    await Post.findByIdAndDelete(post._id);
};

// Soft-delete a comment — keeps the record so any replies still have
// a parent to reference (same as the regular comment delete).
const removeComment = async (comment) => {
    comment.isDeleted = true;
    comment.content = "[This comment was removed by a moderator]";
    await comment.save();
};

// ============================================================
// @desc    Get high-level counts for the admin dashboard overview
// @route   GET /api/admin/stats
// @access  Private/Admin
// ============================================================
const getStats = async (req, res) => {
    const [userCount, postCount, publishedCount, commentCount, adminCount, openReportCount] = await Promise.all([
        User.countDocuments(),
        Post.countDocuments(),
        Post.countDocuments({ isPublished: true }),
        Comment.countDocuments({ isDeleted: false }),
        User.countDocuments({ role: "admin" }),
        Report.countDocuments({ status: "open" }),
    ]);

    res.status(200).json({
        success: true,
        stats: {
            userCount,
            adminCount,
            postCount,
            publishedCount,
            draftCount: postCount - publishedCount,
            commentCount,
            openReportCount,
        },
    });
};

// ============================================================
// @desc    Get every post in the system (published + drafts, any author)
// @route   GET /api/admin/posts
// @access  Private/Admin
// ============================================================
const getAllPostsAdmin = async (req, res) => {
    const { page = 1, limit = 15, search, published } = req.query;

    const filter = {};
    if (search) filter.title = { $regex: escapeRegex(search), $options: "i" };
    if (published === "true") filter.isPublished = true;
    if (published === "false") filter.isPublished = false;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const posts = await Post.find(filter)
        .populate("author", "name username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("-content");

    const total = await Post.countDocuments(filter);

    res.status(200).json({
        success: true,
        posts,
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalPosts: total,
        },
    });
};

// ============================================================
// @desc    Delete any post (any author), including its comments and cover image
// @route   DELETE /api/admin/posts/:id
// @access  Private/Admin
// ============================================================
const deletePostAdmin = async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ success: false, message: "Post not found" });
    }

    await removePost(post);

    res.status(200).json({ success: true, message: "Post removed by admin" });
};

// ============================================================
// @desc    Get every comment in the system (flat list, newest first)
// @route   GET /api/admin/comments
// @access  Private/Admin
// ============================================================
const getAllCommentsAdmin = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const comments = await Comment.find({ isDeleted: false })
        .populate("author", "name username")
        .populate("post", "title slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    const total = await Comment.countDocuments({ isDeleted: false });

    res.status(200).json({
        success: true,
        comments,
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalComments: total,
        },
    });
};

// ============================================================
// @desc    Delete (soft-delete) any comment
// @route   DELETE /api/admin/comments/:id
// @access  Private/Admin
// ============================================================
const deleteCommentAdmin = async (req, res) => {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
        return res.status(404).json({ success: false, message: "Comment not found" });
    }

    await removeComment(comment);

    res.status(200).json({ success: true, message: "Comment removed by admin" });
};

// ============================================================
// @desc    Get every user account (paginated, searchable)
// @route   GET /api/admin/users
// @access  Private/Admin
// ============================================================
const getAllUsersAdmin = async (req, res) => {
    const { page = 1, limit = 15, search } = req.query;

    const filter = {};
    if (search) {
        const escaped = escapeRegex(search);
        filter.$or = [
            { name: { $regex: escaped, $options: "i" } },
            { username: { $regex: escaped, $options: "i" } },
            { email: { $regex: escaped, $options: "i" } },
        ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    const total = await User.countDocuments(filter);

    res.status(200).json({
        success: true,
        users,
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalUsers: total,
        },
    });
};

// ============================================================
// @desc    Promote a user to admin, or demote an admin back to a regular user
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
// ============================================================
const updateUserRole = async (req, res) => {
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ success: false, message: "Role must be 'user' or 'admin'" });
    }

    // Prevent an admin from accidentally demoting/promoting their own account
    // through this endpoint — avoids a lone admin locking themselves out.
    if (req.params.id === req.user._id.toString()) {
        return res.status(400).json({ success: false, message: "You cannot change your own role" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
        success: true,
        message: `${user.username} is now ${role === "admin" ? "an admin" : "a regular user"}`,
        user: { _id: user._id, username: user.username, role: user.role },
    });
};

// ============================================================
// @desc    Delete a user account and clean up everything they own/reference
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
// ============================================================
const deleteUserAdmin = async (req, res) => {
    if (req.params.id === req.user._id.toString()) {
        return res.status(400).json({ success: false, message: "You cannot delete your own account here" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    // Clean up the user's own posts (and their cover images + comments)
    const posts = await Post.find({ author: user._id });
    for (const post of posts) {
        await removePost(post);
    }
    await Series.deleteMany({ author: user._id });
    await Report.deleteMany({ reporter: user._id });

    // Notifications sent to or caused by this user
    await Notification.deleteMany({ $or: [{ recipient: user._id }, { actor: user._id }] });

    // Remove comments this user wrote on OTHER people's posts
    await Comment.deleteMany({ author: user._id });

    // Remove this user from everyone else's followers/following lists,
    // and from every post's/comment's likes/bookmarks arrays, so no
    // dangling ObjectId references are left behind.
    await User.updateMany(
        {},
        { $pull: { followers: user._id, following: user._id } }
    );
    await Post.updateMany({}, { $pull: { likes: user._id, bookmarks: user._id } });
    await Comment.updateMany({}, { $pull: { likes: user._id } });

    if (user.profilePicture?.includes("cloudinary") && !user.profilePicture.includes("/demo/")) {
        const urlParts = user.profilePicture.split("/upload/");
        if (urlParts.length === 2) {
            const publicId = urlParts[1].replace(/^v\d+\//, "").replace(/\.[^/.]+$/, "");
            await cloudinary.uploader.destroy(publicId).catch(() => {});
        }
    }

    await User.findByIdAndDelete(user._id);

    res.status(200).json({ success: true, message: "User and all their content have been removed" });
};

// ============================================================
// @desc    Get reports (open ones by default), newest first
// @route   GET /api/admin/reports?status=open|resolved|dismissed
// @access  Private/Admin
// ============================================================
const getReportsAdmin = async (req, res) => {
    const { page = 1, limit = 20, status = "open" } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const filter = ["open", "resolved", "dismissed"].includes(status) ? { status } : {};

    const [reports, total] = await Promise.all([
        Report.find(filter)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .populate("reporter", "name username")
            .populate({ path: "post", select: "title slug author", populate: { path: "author", select: "name username" } })
            .populate({ path: "comment", select: "content isDeleted author", populate: { path: "author", select: "name username" } }),
        Report.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        reports,
        pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalReports: total },
    });
};

// ============================================================
// @desc    Act on a report: remove the content, or dismiss the report.
//          The decision applies to EVERY open report on the same
//          post/comment, so admins don't review duplicates.
// @route   PUT /api/admin/reports/:id   body: { action: "remove" | "dismiss" }
// @access  Private/Admin
// ============================================================
const reviewReport = async (req, res) => {
    const { action } = req.body;
    if (!["remove", "dismiss"].includes(action)) {
        return res.status(400).json({ success: false, message: "Action must be 'remove' or 'dismiss'" });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
        return res.status(404).json({ success: false, message: "Report not found" });
    }

    if (action === "remove") {
        if (report.comment) {
            const comment = await Comment.findById(report.comment);
            if (comment) await removeComment(comment);
        } else {
            const post = await Post.findById(report.post);
            // Deleting the post also deletes every report about it
            if (post) {
                await removePost(post);
                return res.status(200).json({ success: true, message: "Post removed" });
            }
        }
    }

    await Report.updateMany(
        { post: report.post, comment: report.comment, status: "open" },
        { status: action === "remove" ? "resolved" : "dismissed", reviewedBy: req.user._id }
    );

    res.status(200).json({
        success: true,
        message: action === "remove" ? "Content removed" : "Report dismissed",
    });
};

module.exports = {
    getStats,
    getAllPostsAdmin,
    deletePostAdmin,
    getAllCommentsAdmin,
    deleteCommentAdmin,
    getAllUsersAdmin,
    updateUserRole,
    deleteUserAdmin,
    getReportsAdmin,
    reviewReport,
};
