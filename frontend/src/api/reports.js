// ============================================================
// src/api/reports.js — Report a post or comment to moderators
// ============================================================

import api from "./axios";

// targetType: "post" | "comment", reason: one of the REPORT_REASONS below
export const createReport = async ({ targetType, targetId, reason, details }) => {
    const response = await api.post("/reports", { targetType, targetId, reason, details });
    return response.data;
};

// Must match the reasons accepted by the backend (models/Report.model.js)
export const REPORT_REASONS = [
    { value: "spam", label: "Spam or advertising" },
    { value: "harassment", label: "Harassment or hate" },
    { value: "inappropriate", label: "Inappropriate content" },
    { value: "misinformation", label: "Misleading or false information" },
    { value: "other", label: "Something else" },
];
