// ============================================================
// src/utils/helpers.js — Helper Utility Functions
//
// Small reusable functions that are used across many components.
// Think of this like a "Swiss Army knife" of small tools.
// ============================================================

import { formatDistanceToNow, format } from "date-fns"; // Date formatting library

// Format date as: "5 minutes ago", "2 days ago", "3 months ago"
export const timeAgo = (date) => {
    try {
        return formatDistanceToNow(new Date(date), { addSuffix: true });
        // addSuffix: true means it adds "ago" at the end
    } catch {
        return "some time ago";
    }
};

// Format date as: "March 4, 2024"
export const formatDate = (date) => {
    try {
        return format(new Date(date), "MMMM d, yyyy");
    } catch {
        return "";
    }
};

// Truncate long text and add "..." at the end
// Example: truncateText("Hello World", 5) → "Hello..."
export const truncateText = (text, maxLength = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
};

// Remove HTML tags from a string (for showing excerpt without HTML)
// Example: "<p>Hello <b>World</b></p>" → "Hello World"
export const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "");
};

// Generate avatar initials from a name
// Example: "John Doe" → "JD"
export const getInitials = (name) => {
    if (!name) return "?";
    return name
        .split(" ") // Split by space: ["John", "Doe"]
        .map((word) => word[0]) // First letter of each word: ["J", "D"]
        .join("") // Join: "JD"
        .toUpperCase()
        .substring(0, 2); // Max 2 characters
};

// Format a number nicely
// Example: 1234 → "1.2K", 1234567 → "1.2M"
export const formatCount = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
};

