// ============================================================
// src/components/ProtectedRoute.jsx — Route Guard
//
// This component "wraps" other routes that require login.
// If user is NOT logged in and tries to access a protected page,
// it redirects them to the login page automatically.
//
// Think of it like a door with a keypad —
// if you don't have the code, it sends you back to the entrance.
// ============================================================

import { Navigate, useLocation } from "react-router-dom"; // Navigate = redirect component
import useAuthStore from "../store/authStore";

// "children" = whatever content is nested inside this component
const ProtectedRoute = ({ children }) => {
    const { token } = useAuthStore(); // Check if user has a token
    const isLoggedIn = !!token;
    const location = useLocation(); // Current URL — passed to login so user returns here after login

    if (!isLoggedIn) {
        // Not logged in → redirect to login page
        // Pass the current path as state so LoginPage can redirect back after a successful login
        // "replace" means: replace current URL in history (so Back button doesn't loop)
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // Logged in → show the actual page
    return children;
};

export default ProtectedRoute;
