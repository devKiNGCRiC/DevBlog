// ============================================================
// src/api/auth.js — API functions for Authentication
//
// We separate all API calls from the UI components.
// This way, if the API changes, we only update this file —
// not every single component that uses it!
// ============================================================

import api from "./axios"; // Import our configured axios instance

// Register a new user
export const registerUser = async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data; // Return just the data part (not the full response)
};

// Login an existing user
export const loginUser = async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
};

// Get the currently logged-in user
export const getCurrentUser = async () => {
    const response = await api.get("/auth/me");
    return response.data;
};

// Update user profile (can include file upload for profile picture)
export const updateUserProfile = async (formData) => {
    // When uploading files, Content-Type must be "multipart/form-data"
    // But axios handles this automatically when we pass FormData!
    const response = await api.put("/auth/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

// Change password
export const changePassword = async (data) => {
    const response = await api.put("/auth/change-password", data);
    return response.data;
};

// Request a password reset email (for users who forgot their password)
export const forgotPassword = async (email) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
};

// Reset password using the token from the reset email
export const resetPassword = async (token, newPassword) => {
    const response = await api.post("/auth/reset-password", { token, newPassword });
    return response.data;
};
