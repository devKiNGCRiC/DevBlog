// ============================================================
// src/App.jsx — Main Application Router
//
// This file is the "brain" that connects all pages to their URLs.
// React Router listens to the URL and shows the right page.
//
// Route types:
// - Public routes: anyone can visit (Home, Login, Post Detail...)
// - Protected routes: only logged-in users (wrapped with <ProtectedRoute>)
// ============================================================

import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
// "Toaster" shows beautiful popup notifications at the top-right corner
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async"; // Per-page <title> and meta tags
import { useEffect, lazy, Suspense } from "react";

// Import layout/components that appear on ALL pages
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import useAuthStore from "./store/authStore";

// Lazy-load all page components for route-level code splitting.
// Each page is only downloaded when the user navigates to it.
const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const PostDetailPage = lazy(() => import("./pages/PostDetailPage"));
const CreatePostPage = lazy(() => import("./pages/CreatePostPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const BookmarksPage = lazy(() => import("./pages/BookmarksPage"));
const MyPostsPage = lazy(() => import("./pages/MyPostsPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const EditProfilePage = lazy(() => import("./pages/EditProfilePage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));

// Inner component so it can use useNavigate (which requires Router context)
function AppContent() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  // Listen for the custom "auth:logout" event dispatched by axios interceptor
  // on a 401 response. This lets us use React Router navigation instead of
  // a hard window.location redirect.
  useEffect(() => {
    const handleAuthLogout = () => {
      logout();
      navigate("/login", { replace: true });
    };
    window.addEventListener("auth:logout", handleAuthLogout);
    return () => window.removeEventListener("auth:logout", handleAuthLogout);
  }, [logout, navigate]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Navbar appears on every page */}
      <Navbar />

      {/* Toaster shows toast notifications (react-hot-toast) */}
      <Toaster
        position="top-right" // Position on screen
        toastOptions={{
          duration: 4000, // Auto-dismiss after 4 seconds
          style: {
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)",
            fontSize: "0.875rem",
          },
          success: {
            iconTheme: { primary: "#10b981", secondary: "white" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "white" },
          },
        }}
      />

      {/* ====================================================
        ROUTES — Each Route maps a URL path to a component.
        Routes are checked from top to bottom.
        The first matching Route is rendered.
        ==================================================== */}
      {/* Suspense shows a fallback spinner while lazy-loaded page chunks are downloading */}
      <Suspense fallback={<LoadingSpinner fullPage />}>
        <Routes>
          {/* --- Public Routes (No login required) --- */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/post/:slug" element={<PostDetailPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />

          {/* Redirect /search?q=... to /?q=... so the Navbar search always works */}
          <Route path="/search" element={<SearchRedirect />} />
          {/* Email verification page — opened from the link in the verification email */}
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* --- Protected Routes (Login required) --- */}
          {/* ProtectedRoute wraps the page and redirects to /login if not authenticated */}
          <Route
            path="/write"
            element={
              <ProtectedRoute>
                <CreatePostPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit/:id"
            element={
              <ProtectedRoute>
                {/* isEditing={true} tells CreatePostPage to use update mode */}
                <CreatePostPage isEditing={true} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookmarks"
            element={
              <ProtectedRoute>
                <BookmarksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-posts"
            element={
              <ProtectedRoute>
                <MyPostsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* --- 404 Not Found Route --- */}
          {/* The "*" path matches ANYTHING not matched above */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      {/* Footer appears on every page at the bottom */}
      <Footer />
    </div>
  );
}

// Redirect /search?q=... to /?q=... so homepage handles the search
function SearchRedirect() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q") || "";
  return <Navigate to={q ? `/?q=${encodeURIComponent(q)}` : "/"} replace />;
}

function App() {
  return (
    // HelmetProvider enables per-page <title> and meta tags via react-helmet-async
    <HelmetProvider>
      <Router>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </Router>
    </HelmetProvider>
  );
}

export default App;
