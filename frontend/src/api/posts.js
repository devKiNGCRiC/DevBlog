// ============================================================
// src/api/posts.js — API functions for Blog Posts
// ============================================================

import api from "./axios";

// Get all posts (supports pagination, search, filters)
// "params" is an object like: { page: 1, limit: 10, search: "react" }
export const getAllPosts = async (params = {}) => {
    const response = await api.get("/posts", { params });
    return response.data;
};

// Get a single post by its URL slug
export const getPostBySlug = async (slug) => {
    const response = await api.get(`/posts/slug/${slug}`);
    return response.data;
};

// Get a single post by its MongoDB ID (used by the edit page)
export const getPostById = async (id) => {
    const response = await api.get(`/posts/id/${id}`);
    return response.data;
};

// Get current user's own posts
export const getMyPosts = async (params = {}) => {
    const response = await api.get("/posts/my-posts", { params });
    return response.data;
};

// Get bookmarked posts
export const getBookmarkedPosts = async (params = {}) => {
    const response = await api.get("/posts/bookmarks", { params });
    return response.data;
};

// Create a new post (FormData because of image upload)
export const createPost = async (formData) => {
    const response = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

// Update a post
export const updatePost = async (id, formData) => {
    const response = await api.put(`/posts/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

// Delete a post
export const deletePost = async (id) => {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
};

// Like or Unlike a post
export const likePost = async (id) => {
    const response = await api.post(`/posts/${id}/like`);
    return response.data;
};

// Bookmark or Remove bookmark from a post
export const bookmarkPost = async (id) => {
    const response = await api.post(`/posts/${id}/bookmark`);
    return response.data;
};

// Get all distinct categories from published posts
export const getCategories = async () => {
    const response = await api.get("/posts/categories");
    return response.data;
};
