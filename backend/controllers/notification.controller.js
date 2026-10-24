// ============================================================
// controllers/notification.controller.js — The logged-in user's notifications
// ============================================================

const Notification = require("../models/Notification.model");

// ============================================================
// @desc    Get my notifications (newest first, paginated)
// @route   GET /api/notifications
// @access  Private
// ============================================================
const getNotifications = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const filter = { recipient: req.user._id };

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .populate("actor", "name username profilePicture")
            .populate("post", "title slug")
            .populate("comment", "content"),
        Notification.countDocuments(filter),
        Notification.countDocuments({ ...filter, read: false }),
    ]);

    res.status(200).json({
        success: true,
        // Skip notifications whose actor was deleted since — there's nothing to show
        notifications: notifications.filter((n) => n.actor),
        unreadCount,
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalNotifications: total,
        },
    });
};

// ============================================================
// @desc    How many unread notifications do I have? (for the navbar bell)
// @route   GET /api/notifications/unread-count
// @access  Private
// ============================================================
const getUnreadCount = async (req, res) => {
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.status(200).json({ success: true, unreadCount });
};

// ============================================================
// @desc    Mark one notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
// ============================================================
const markAsRead = async (req, res) => {
    // Filtering by recipient means users can only touch their OWN notifications
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipient: req.user._id },
        { read: true },
        { returnDocument: "after" }
    );
    if (!notification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.status(200).json({ success: true, notification });
};

// ============================================================
// @desc    Mark all my notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
// ============================================================
const markAllAsRead = async (req, res) => {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.status(200).json({ success: true, message: "All notifications marked as read" });
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
