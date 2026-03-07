// ============================================================
// src/api/axios.js — Axios Instance with JWT Auto-Injection
//
// Axios is like a "fetch" wrapper — it makes HTTP requests easier.
// This file creates a CONFIGURED axios instance (not the default one).
//
// The special thing here is the "interceptor":
// Every single request automatically gets the JWT token attached.
// So you NEVER have to manually add the token in each API call!
// Think of it like a post office that stamps every letter automatically.
// ============================================================

import axios from "axios";

// Create a custom axios instance with our base URL
// "import.meta.env.VITE_API_URL" reads from our .env file
// All API calls will be prefixed with this URL
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json", // We send/receive JSON by default
    },
});

// ============================================================
// REQUEST INTERCEPTOR — Runs BEFORE every API call
//
// It automatically adds the JWT token to every request header.
// The token is read from Zustand's persisted state (single source of truth).
// ============================================================
api.interceptors.request.use(
    (config) => {
        // Read token from Zustand persisted state (devblog-auth key in localStorage)
        // This is the single source of truth — no separate "token" key needed
        try {
            const persisted = localStorage.getItem("devblog-auth");
            if (persisted) {
                const parsed = JSON.parse(persisted);
                const token = parsed?.state?.token;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        } catch {
            // Silently ignore parse errors — request proceeds without auth header
        }

        return config; // Return the modified config (request proceeds)
    },
    (error) => {
        // If there's an error setting up the request, reject it
        return Promise.reject(error);
    }
);

// ============================================================
// RESPONSE INTERCEPTOR — Runs AFTER every API response
//
// If the server returns 401 (Unauthorized / token expired),
// clear the persisted auth state and redirect to login.
// ============================================================
api.interceptors.response.use(
    (response) => response, // If response is ok, just return it as-is

    (error) => {
        // If token is expired or invalid (401 = Unauthorized)
        if (error.response?.status === 401) {
            // Clear the Zustand persisted state (single source of truth)
            localStorage.removeItem("devblog-auth");
            // Use React Router-friendly navigation instead of hard reload
            // We cannot import useNavigate here (hooks only work in components),
            // so we dispatch a custom event that App.jsx listens for.
            window.dispatchEvent(new CustomEvent("auth:logout"));
        }
        return Promise.reject(error); // Pass the error along
    }
);

export default api;
