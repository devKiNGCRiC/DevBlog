// ============================================================
// src/api/series.js — API functions for Post Series
// ============================================================

import api from "./axios";

// My series (for the editor's dropdown)
export const getMySeries = async () => {
    const response = await api.get("/series/mine");
    return response.data;
};

// Create a new series
export const createSeries = async (seriesData) => {
    const response = await api.post("/series", seriesData);
    return response.data;
};
