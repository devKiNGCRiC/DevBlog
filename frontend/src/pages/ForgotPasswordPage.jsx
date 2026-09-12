// ============================================================
// src/pages/ForgotPasswordPage.jsx — Request a Password Reset Link
//
// A user who forgot their password can't use "Change Password"
// (that requires being logged in AND knowing the current password).
// This page lets them request a reset link sent to their email.
// ============================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { forgotPassword } from "../api/auth";
import toast from "react-hot-toast";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    // Once the request succeeds, show a confirmation instead of the form.
    // We do this regardless of whether the email actually exists in our
    // database — the backend intentionally gives the same response either
    // way, so we shouldn't reveal anything different here.
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error("Please enter your email address");
            return;
        }

        setSubmitting(true);
        try {
            await forgotPassword(email.trim());
            setSubmitted(true);
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-wrapper">
            <Helmet><title>Forgot Password | DevBlog</title></Helmet>
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
                    {submitted ? (
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📬</div>
                            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>
                                Check your inbox
                            </h1>
                            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                                If an account exists for <strong>{email}</strong>, we've sent a link to reset your
                                password. The link expires in 1 hour.
                            </p>
                            <Link to="/login" className="btn btn-primary">Back to Login</Link>
                        </div>
                    ) : (
                        <>
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
                                >🔑</div>
                                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                                    Forgot your password?
                                </h1>
                                <p style={{ color: "var(--text-muted)" }}>
                                    Enter your email and we'll send you a link to reset it.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="email">Email Address</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="form-input"
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-full btn-lg"
                                    disabled={submitting}
                                    style={{ marginTop: "0.5rem" }}
                                >
                                    {submitting ? "Sending..." : "Send Reset Link"}
                                </button>
                            </form>

                            <p style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "1.5rem" }}>
                                Remembered your password?{" "}
                                <Link to="/login" style={{ fontWeight: 600, color: "var(--accent-primary)" }}>
                                    Sign in
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
