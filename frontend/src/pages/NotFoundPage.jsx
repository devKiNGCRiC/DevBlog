// ============================================================
// src/pages/NotFoundPage.jsx — 404 Not Found Page
// ============================================================

import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const NotFoundPage = () => {
    return (
        <div className="page-wrapper flex-center" style={{ textAlign: "center" }}>
            <Helmet><title>404 — Page Not Found | DevBlog</title></Helmet>
            <div>
                <div style={{ fontSize: "6rem", marginBottom: "1rem" }}>😕</div>
                <h1 style={{ fontSize: "3rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                    404
                </h1>
                <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                    Oops! The page you're looking for doesn't exist.
                </p>
                {/* Use React Router Link instead of <a href> to avoid full page reload */}
                <Link to="/" className="btn btn-primary">
                    ← Go Home
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;
