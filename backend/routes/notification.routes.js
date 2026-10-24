// ============================================================
// routes/notification.routes.js — Notification Routes
// Every route here is private: you can only see your own notifications.
// ============================================================

const express = require("express");
const router = express.Router();

const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} = require("../controllers/notification.controller");

const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/", getNotifications); // GET /api/notifications
router.get("/unread-count", getUnreadCount); // GET /api/notifications/unread-count
router.put("/read-all", markAllAsRead); // PUT /api/notifications/read-all
router.put("/:id/read", markAsRead); // PUT /api/notifications/:id/read

module.exports = router;
