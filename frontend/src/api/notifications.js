// ============================================================
// src/api/notifications.js — API functions for Notifications
// ============================================================

import api from "./axios";

// Get my notifications (paginated, newest first)
export const getNotifications = async (params = {}) => {
    const response = await api.get("/notifications", { params });
    return response.data;
};

// Just the number of unread notifications (for the navbar bell)
export const getUnreadCount = async () => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
};

// Mark one notification as read
export const markNotificationRead = async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
};

// Mark all my notifications as read
export const markAllNotificationsRead = async () => {
    const response = await api.put("/notifications/read-all");
    return response.data;
};
