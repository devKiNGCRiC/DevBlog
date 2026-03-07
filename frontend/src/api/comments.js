// ============================================================
// src/api/comments.js — API functions for Comments
// ============================================================

import api from "./axios";

// Get all comments for a post
export const getComments = async (postId) => {
    const response = await api.get(`/posts/${postId}/comments`);
    return response.data;
};

// Add a comment to a post
// "parentCommentId" (optional) = the ID of the comment being replied to
export const addComment = async (postId, content, parentCommentId = null) => {
    const response = await api.post(`/posts/${postId}/comments`, {
        content,
        parentCommentId,
    });
    return response.data;
};

// Delete a comment
export const deleteComment = async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
};

// Like/Unlike a comment
export const likeComment = async (commentId) => {
    const response = await api.post(`/comments/${commentId}/like`);
    return response.data;
};
