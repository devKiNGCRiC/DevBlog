// ============================================================
// src/pages/ResetPasswordPage.jsx — Set a New Password
//
// Opened from the link in the "forgot password" email:
// /reset-password?token=...
// Lets the user choose a new password, then sends it + the token
// to the backend to complete the reset.
// ============================================================

import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { resetPassword } from "../api/auth";
import toast from "react-hot-toast";

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error("Missing or invalid reset link. Please request a new one.");
            return;
        }
        if (formData.newPassword.length < 8) {
            toast.error("New password must be at least 8 characters");
            return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setSubmitting(true);
        try {
            await resetPassword(token, formData.newPassword);
            toast.success("Password reset! Please log in with your new password. 🔒");
            navigate("/login", { replace: true });
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Failed to reset password. The link may have expired."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // No token in the URL at all — this page was opened directly, not from an email link
    if (!token) {
        return (
            <div className="page-wrapper flex-center" style={{ textAlign: "center" }}>
                <Helmet><title>Reset Password | DevBlog</title></Helmet>
                <div style={{ maxWidth: 480 }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>❌</div>
                    <h2>Invalid Reset Link</h2>
                    <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                        This password reset link is missing its token. Please request a new one.
                    </p>
                    <Link to="/forgot-password" className="btn btn-primary">Request New Link</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <Helmet><title>Reset Password | DevBlog</title></Helmet>
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
                    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                        <div
                            style={{
                                width: 56, height: 56,
                                background: "var(--accent-gradient)",
                                borderRadius: "var(--radius-lg)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "1.5rem", fontWeight: 800, color: "white",
                                margin: "0 auto 1rem",
                            }}
                        >🔒</div>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                            Choose a new password
                        </h1>
                        <p style={{ color: "var(--text-muted)" }}>
                            Make it something you'll remember this time!
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="newPassword">New Password</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="At least 8 characters"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: "absolute", right: "0.75rem", top: "50%",
                                        transform: "translateY(-50%)", background: "none",
                                        border: "none", cursor: "pointer", color: "var(--text-muted)",
                                    }}
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
                            <input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Repeat new password"
                                autoComplete="new-password"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-full btn-lg"
                            disabled={submitting}
                            style={{ marginTop: "0.5rem" }}
                        >
                            {submitting ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
