// ============================================================
// src/components/ErrorBoundary.jsx — React Error Boundary
//
// Catches unhandled JavaScript errors in the component tree
// and shows a friendly fallback UI instead of a blank white page.
// ============================================================

import { Component } from "react";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // Log to console in development; swap for a remote logging service in production
        console.error("ErrorBoundary caught:", error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    className="page-wrapper flex-center"
                    style={{ textAlign: "center", padding: "4rem 1.5rem" }}
                >
                    <div>
                        <div style={{ fontSize: "5rem", marginBottom: "1rem" }}>💥</div>
                        <h1
                            style={{
                                fontSize: "2rem",
                                fontWeight: 800,
                                marginBottom: "0.75rem",
                                color: "var(--text-primary)",
                            }}
                        >
                            Something went wrong
                        </h1>
                        <p
                            style={{
                                color: "var(--text-muted)",
                                marginBottom: "2rem",
                                maxWidth: 480,
                                margin: "0 auto 2rem",
                            }}
                        >
                            An unexpected error occurred. Please refresh the page or go back home.
                        </p>
                        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => window.location.reload()}
                            >
                                🔄 Refresh Page
                            </button>
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    this.setState({ hasError: false, error: null });
                                    window.location.href = "/";
                                }}
                            >
                                ← Go Home
                            </button>
                        </div>
                        {import.meta.env.DEV && this.state.error && (
                            <pre
                                style={{
                                    marginTop: "2rem",
                                    textAlign: "left",
                                    background: "var(--bg-secondary)",
                                    border: "1px solid var(--border-color)",
                                    borderRadius: "var(--radius-md)",
                                    padding: "1.5rem",
                                    fontSize: "0.75rem",
                                    color: "var(--danger)",
                                    overflow: "auto",
                                    maxWidth: 700,
                                    margin: "2rem auto 0",
                                }}
                            >
                                {this.state.error.toString()}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
