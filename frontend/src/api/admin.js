// ============================================================
// src/api/admin.js — API functions for the Admin Dashboard
//
// All of these hit /api/admin/* routes, which the backend rejects
// with a 403 unless the logged-in user has role: "admin".
// ============================================================

import api from "./axios";

// Overview counts (users, posts, drafts, comments)
export const getAdminStats = async () => {
    const response = await api.get("/admin/stats");
    return response.data;
};

// Every post in the system (published + drafts, any author)
export const getAdminPosts = async (params) => {
    const response = await api.get("/admin/posts", { params });
    return response.data;
};

// Delete any post, regardless of author
export const deleteAdminPost = async (postId) => {
    const response = await api.delete(`/admin/posts/${postId}`);
    return response.data;
};

// Every comment in the system (flat list, newest first)
export const getAdminComments = async (params) => {
    const response = await api.get("/admin/comments", { params });
    return response.data;
};

// Delete (soft-delete) any comment
export const deleteAdminComment = async (commentId) => {
    const response = await api.delete(`/admin/comments/${commentId}`);
    return response.data;
};

// Every user account (paginated, searchable)
export const getAdminUsers = async (params) => {
    const response = await api.get("/admin/users", { params });
    return response.data;
};

// Promote a user to admin, or demote an admin back to a regular user
export const updateAdminUserRole = async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
};

// Delete a user account and everything they own
export const deleteAdminUser = async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
};

// Reported posts/comments (status: "open" | "resolved" | "dismissed")
export const getAdminReports = async (params) => {
    const response = await api.get("/admin/reports", { params });
    return response.data;
};

// Act on a report — action: "remove" (delete the content) or "dismiss" (keep it)
export const reviewAdminReport = async (reportId, action) => {
    const response = await api.put(`/admin/reports/${reportId}`, { action });
    return response.data;
};
