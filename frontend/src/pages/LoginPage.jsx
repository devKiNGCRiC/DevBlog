// ============================================================
// src/pages/LoginPage.jsx — User Login Page
//
// A clean, beautiful login form.
// Validates input, calls the login API, saves token, redirects.
// ============================================================

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const LoginPage = () => {
    const navigate = useNavigate();
    // useLocation lets us know where the user came from (to redirect back after login)
    const location = useLocation();
    const { login, isLoading } = useAuthStore();

    // Form state
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false); // Toggle password visibility

    // Handle input changes — one handler for all fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Update only the field that changed, keep others the same (spread operator)
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent browser refresh

        // Basic validation
        if (!formData.email || !formData.password) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            await login(formData); // Zustand login action
            toast.success("Welcome back! 🎉");
            // Redirect to: where they came from OR home page
            const redirectTo = location.state?.from || "/";
            navigate(redirectTo, { replace: true });
        } catch (error) {
            toast.error(error.message || "Login failed");
        }
    };

    return (
        <div className="page-wrapper">
            <Helmet><title>Login | DevBlog</title></Helmet>
            <div
                className="flex-center"
                style={{ minHeight: "calc(100vh - var(--navbar-height))", padding: "2rem 1rem" }}
            >
                <div
                    className="card"
                    style={{
                        width: "100%",
                        maxWidth: 440,
                        padding: "clamp(1.25rem, 5vw, 2.5rem)",
                        animation: "fadeIn 0.3s ease",
                    }}
                >
                    {/* Logo */}
                    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                background: "var(--accent-gradient)",
                                borderRadius: "var(--radius-lg)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.5rem",
                                fontWeight: 800,
                                color: "white",
                                margin: "0 auto 1rem",
                            }}
                        >
                            D
                        </div>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                            Welcome back!
                        </h1>
                        <p style={{ color: "var(--text-muted)" }}>
                            Sign in to continue to DevBlog
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="you@example.com"
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">
                                Password
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"} /* Toggle between text and password */
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: "absolute",
                                        right: "0.75rem",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "var(--text-muted)",
                                        fontSize: "1rem",
                                    }}
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-full btn-lg"
                            disabled={isLoading}
                            style={{ marginTop: "0.5rem" }}
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner" style={{ width: 18, height: 18 }} />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In →"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            margin: "1.5rem 0",
                        }}
                    >
                        <hr className="divider" style={{ flex: 1, margin: 0 }} />
                        <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                            or
                        </span>
                        <hr className="divider" style={{ flex: 1, margin: 0 }} />
                    </div>

                    {/* Register link */}
                    <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                        Don't have an account?{" "}
                        <Link
                            to="/register"
                            style={{ fontWeight: 600, color: "var(--accent-primary)" }}
                        >
                            Create one for free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
