// ============================================================
// src/pages/AboutPage.jsx — About Us Page
// ============================================================

import React from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

const AboutPage = () => {
    const { user } = useAuthStore();

    return (
        <div className="page-wrapper container" style={{ padding: "4rem 1rem", maxWidth: "800px"  }}>
            <div className="card" style={{ padding: "3rem", animation: "fadeIn 0.5s ease" ,  marginTop: "4rem"}}>
                <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1.5rem", textAlign: "center" }}>
                    About <span style={{ color: "var(--accent-primary)" }}>DevBlog</span>
                </h1>

                <div style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "var(--text-secondary)" }}>
                    <p style={{ marginBottom: "1.5rem" }}>
                        Welcome to <strong>DevBlog</strong>, a community-driven platform designed specifically for developers, designers, and tech enthusiasts.
                        Our mission is to create a clean, distraction-free environment where people can share knowledge, write tutorials, and connect with like-minded individuals.
                    </p>

                    <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2rem", marginBottom: "1rem" }}>
                        The Project Story
                    </h2>
                    <p style={{ marginBottom: "1.5rem" }}>
                        DevBlog was built as a passion project by a 1st-year MCA student from Chennai, India, learning the MERN (MongoDB, Express, React, Node.js) stack.
                        It features modern web development practices including robust authentication, rich-text editing, a beautiful 3-mode theme system (Light, Dark, Sepia), and a fully responsive design.
                    </p>

                    <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2rem", marginBottom: "1rem" }}>
                        Core Features
                    </h2>
                    <ul style={{ marginBottom: "2rem", listStylePosition: "inside", paddingLeft: "1rem" }}>
                        <li><strong>📝 Rich Text Publishing:</strong> Write beautiful articles with a Medium-style editor.</li>
                        <li><strong>💬 Nested Discussions:</strong> Engage deeply with threaded comments and replies.</li>
                        <li><strong>🎨 Beautiful Themes:</strong> Read comfortably day or night with Light, Dark, and Sepia modes.</li>
                        <li><strong>🔖 Personalized Feed:</strong> Follow your favorite authors and bookmark posts for later.</li>
                    </ul>

                    <div style={{ marginTop: "3rem", textAlign: "center" }}>
                        {user ? (
                            // User is already logged in — invite them to write instead
                            <>
                                <p style={{ marginBottom: "1.5rem", fontWeight: 600 }}>
                                    Welcome back, {user.name}! Ready to share something new?
                                </p>
                                <Link to="/write" className="btn btn-primary btn-lg">
                                    Write a Post ✍️
                                </Link>
                            </>
                        ) : (
                            // Guest — invite them to register
                            <>
                                <p style={{ marginBottom: "1.5rem", fontWeight: 600 }}>
                                    Ready to share your knowledge with the world?
                                </p>
                                <Link to="/register" className="btn btn-primary btn-lg">
                                    Join the Community Today 🚀
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
