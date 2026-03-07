// ============================================================
// src/store/authStore.js — Global Authentication State (Zustand)
//
// Zustand is a simple state management tool.
// "State" = data that the whole app needs to know about (like: is the user logged in?)
//
// Instead of passing user data from component to component manually (called "prop drilling"),
// we store it in Zustand and ANY component can access it directly.
//
// Think of Zustand like a shared whiteboard in the classroom —
// anyone can read from it or write to it.
// ============================================================

import { create } from "zustand"; // Zustand's main function to create a store

// "persist" middleware saves the state to localStorage automatically!
// So even after refreshing the page, the user stays logged in.
import { persist } from "zustand/middleware";

import { loginUser, registerUser, getCurrentUser } from "../api/auth";

// Create the auth store
// "set" is a function that updates the state
// "get" lets us read the current state within actions
const useAuthStore = create(
    persist(
        (set, get) => ({
            // ============================================================
            // STATE (the data we store)
            // ============================================================
            user: null, // null = no user logged in. Object = user info
            token: null, // The JWT token string
            isLoading: false, // Is an API call currently in progress?
            error: null, // Latest error message (if any)

            // COMPUTED VALUES (like virtual fields)
            // ============================================================
            // (Note: we removed isLoggedIn getter because it breaks with Zustand persist.
            // Components should just check `!!user` or `!!token` instead.)

            // ============================================================
            // ACTIONS (functions that change the state)
            // ============================================================

            // Login action
            login: async (credentials) => {
                set({ isLoading: true, error: null }); // Show loading state
                try {
                    const data = await loginUser(credentials); // Call API
                    // Token is stored only in Zustand persisted state (devblog-auth key)
                    // The axios interceptor reads it from the store via getState()
                    set({
                        user: data.user,
                        token: data.token,
                        isLoading: false,
                        error: null,
                    });
                    return data; // Return data so the component can use it
                } catch (error) {
                    const message =
                        error.response?.data?.message || "Login failed. Please try again.";
                    set({ isLoading: false, error: message }); // Show error state
                    throw new Error(message); // Throw so the component knows it failed
                }
            },

            // Register action
            register: async (userData) => {
                set({ isLoading: true, error: null });
                try {
                    const data = await registerUser(userData);
                    set({
                        user: data.user,
                        token: data.token,
                        isLoading: false,
                        error: null,
                    });
                    return data;
                } catch (error) {
                    const message =
                        error.response?.data?.message ||
                        "Registration failed. Please try again.";
                    set({ isLoading: false, error: message });
                    throw new Error(message);
                }
            },

            // Logout action
            logout: () => {
                // Reset store state back to defaults (Zustand persist will clear localStorage)
                set({ user: null, token: null, error: null });
            },

            // Update user profile in the store (after profile update API call)
            updateUser: (updatedUser) => {
                set({ user: updatedUser });
            },

            // Refresh user data from server
            refreshUser: async () => {
                try {
                    const data = await getCurrentUser();
                    set({ user: data.user });
                } catch (error) {
                    // Only logout on 401 (invalid/expired token)
                    // Network errors or 5xx should NOT log the user out
                    if (error.response?.status === 401) {
                        get().logout();
                    }
                }
            },

            // Clear any error messages
            clearError: () => set({ error: null }),
        }),
        {
            // Zustand persist configuration
            name: "devblog-auth", // Key name in localStorage
            // Only persist token and user — not loading/error states
            partialize: (state) => ({ user: state.user, token: state.token }),
        }
    )
);

export default useAuthStore;
