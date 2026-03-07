// ============================================================
// src/components/Footer.jsx — Global Footer
// ============================================================

import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                {/* Top grid: brand + link columns */}
                <div className="footer-grid">
                    {/* Brand */}
                    <div className="footer-brand">
                        <Link to="/" className="footer-logo">
                            <div className="footer-logo-icon">D</div>
                            <span className="footer-logo-text">DevBlog</span>
                        </Link>
                        <p className="footer-tagline">
                            A modern platform for developers and tech enthusiasts to share
                            knowledge, stories, and ideas. Built with the MERN stack.
                        </p>
                    </div>

                    {/* Platform links */}
                    <div>
                        <h3 className="footer-col-heading">Platform</h3>
                        <ul className="footer-links">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Legal links */}
                    {/*<div>
                        <h3 className="footer-col-heading">Legal</h3>
                        <ul className="footer-links">
                            <li><Link to="#">Privacy Policy</Link></li>
                            <li><Link to="#">Terms of Service</Link></li>
                            <li><Link to="#">Cookie Policy</Link></li>
                        </ul>
                    </div>*/}
                </div>

                {/* Bottom bar */}
                <div className="footer-bottom">
                    <p className="footer-bottom-text">
                        © {new Date().getFullYear()} DevBlog. All rights reserved.
                    </p>
                    <p className="footer-bottom-badge">
                        Developed by <span><a href="https://github.com/devKINGCRiC" target="_blank" rel="noopener noreferrer">devKiNGCRiC</a></span> · Built with the MERN stack
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
