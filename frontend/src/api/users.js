// ============================================================
// src/api/users.js — API functions for Users
// ============================================================

import api from "./axios";

// Get a user's public profile by username
export const getUserProfile = async (username, params = {}) => {
    const response = await api.get(`/users/${username}`, { params });
    return response.data;
};

// Follow or Unfollow a user by their ID
export const followUser = async (userId) => {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data;
};

// Search for users by name or username
export const searchUsers = async (query) => {
    const response = await api.get("/users/search", { params: { q: query } });
    return response.data;
};
