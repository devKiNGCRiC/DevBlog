// ============================================================
// src/api/ai.js — AI writing assistant (Claude, via our backend)
// ============================================================

import api from "./axios";

// { enabled: boolean } — false when the server has no ANTHROPIC_API_KEY
export const getAiStatus = async () => {
    const response = await api.get("/ai/status");
    return response.data;
};

// Returns { excerpt, tags: [], titles: [] } for a draft
export const getAiSuggestions = async ({ title, content }) => {
    const response = await api.post("/ai/suggest", { title, content });
    return response.data;
};
