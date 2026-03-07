// ============================================================
// src/pages/VerifyEmailPage.jsx — Email Verification Handler
//
// This page is opened when the user clicks the verification link
// in their email. It reads the token from the URL and calls the API.
// ============================================================

import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import api from "../api/axios";

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    // Initialize status based on whether a token is present in the URL
    const [status, setStatus] = useState(token ? "loading" : "error");
    const [message, setMessage] = useState(
        token ? "" : "No verification token found in the URL."
    );

    useEffect(() => {
        if (!token) return; // Already handled by initial state

        api.get(`/auth/verify-email?token=${token}`)
            .then((res) => {
                setStatus("success");
                setMessage(res.data.message || "Email verified successfully!");
            })
            .catch((err) => {
                setStatus("error");
                setMessage(
                    err.response?.data?.message ||
                    "Verification failed. The link may have expired."
                );
            });
    }, [token]);

    return (
        <div className="page-wrapper flex-center" style={{ textAlign: "center" }}>
            <Helmet><title>Verify Email | DevBlog</title></Helmet>
            <div style={{ maxWidth: 480 }}>
                {status === "loading" && (
                    <>
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
                        <h2>Verifying your email...</h2>
                        <p style={{ color: "var(--text-muted)" }}>Please wait a moment.</p>
                    </>
                )}
                {status === "success" && (
                    <>
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
                        <h2>Email Verified!</h2>
                        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>{message}</p>
                        <Link to="/login" className="btn btn-primary">Go to Login</Link>
                    </>
                )}
                {status === "error" && (
                    <>
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>❌</div>
                        <h2>Verification Failed</h2>
                        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>{message}</p>
                        <Link to="/" className="btn btn-ghost">Go Home</Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
