// ============================================================
// src/components/Navbar.jsx — Top Navigation Bar (Responsive)
//
// Desktop: Logo | Search | Theme | Write | Avatar dropdown
// Mobile:  Logo | Theme toggle | Hamburger → slide-in drawer
// ============================================================

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { getInitials } from "../utils/helpers";
import "./Navbar.css";

const Navbar = () => {
    const { user, logout } = useAuthStore();
    const isLoggedIn = !!user;
    const navigate = useNavigate();
    const location = useLocation();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false); // mobile drawer
    const [searchOpen, setSearchOpen] = useState(false); // mobile search expand
    const [scrolled, setScrolled] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef(null);

    // Close menus when route changes
    useEffect(() => {
        setMenuOpen(false);
        setDropdownOpen(false);
        setSearchOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when mobile drawer is open
    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [menuOpen]);

    // Scroll shadow
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Apply theme
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setDropdownOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const cycleTheme = () => {
        const themes = ["light", "dark", "sepia"];
        setTheme(themes[(themes.indexOf(theme) + 1) % themes.length]);
    };

    const themeIcon = theme === "light" ? "🌙" : theme === "dark" ? "📜" : "☀️";
    const themeLabel = theme === "light" ? "Dark mode" : theme === "dark" ? "Sepia mode" : "Light mode";

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
            setMenuOpen(false);
            setSearchOpen(false);
        }
    };

    const handleLogout = () => {
        logout();
        setDropdownOpen(false);
        setMenuOpen(false);
        navigate("/");
    };

    return (
        <>
            <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
                <div className="container navbar-inner">
                    {/* LOGO */}
                    <Link to="/" className="navbar-logo">
                        <div className="logo-icon">D</div>
                        <span className="logo-text">DevBlog</span>
                    </Link>

                    {/* DESKTOP SEARCH */}
                    <form className="navbar-search" onSubmit={handleSearch}>
                        <span className="navbar-search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search posts, topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Search posts"
                        />
                    </form>

                    {/* DESKTOP ACTIONS */}
                    <div className="navbar-actions">
                        <button
                            className="theme-toggle"
                            onClick={cycleTheme}
                            title={themeLabel}
                            aria-label={themeLabel}
                        >
                            {themeIcon}
                        </button>

                        {isLoggedIn ? (
                            <>
                                <Link to="/write" className="btn btn-primary btn-sm">
                                    ✏️ <span className="write-btn-text">Write</span>
                                </Link>

                                <div className="dropdown-wrapper" ref={dropdownRef}>
                                    <button
                                        className="avatar-btn"
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        aria-expanded={dropdownOpen}
                                        aria-haspopup="menu"
                                        aria-label="Open user menu"
                                    >
                                        {user?.profilePicture
                                            ? <img src={user.profilePicture} alt={user.name} className="user-avatar" />
                                            : <div className="avatar-placeholder">{getInitials(user?.name)}</div>
                                        }
                                    </button>

                                    {dropdownOpen && (
                                        <div className="dropdown-menu" role="menu">
                                            <div className="dropdown-user-info">
                                                <div className="dropdown-user-name">{user?.name}</div>
                                                <div className="dropdown-user-handle">@{user?.username}</div>
                                            </div>
                                            <hr className="dropdown-divider" />
                                            <Link to={`/profile/${user?.username}`} className="dropdown-link" role="menuitem">👤 Profile</Link>
                                            <Link to="/my-posts" className="dropdown-link" role="menuitem">📝 My Posts</Link>
                                            <Link to="/bookmarks" className="dropdown-link" role="menuitem">🔖 Bookmarks</Link>
                                            <Link to="/settings" className="dropdown-link" role="menuitem">⚙️ Settings</Link>
                                            {user?.role === "admin" && (
                                                <Link to="/admin" className="dropdown-link" role="menuitem">🛡️ Admin Dashboard</Link>
                                            )}
                                            <hr className="dropdown-divider" />
                                            <button className="dropdown-item danger" onClick={handleLogout} role="menuitem">
                                                🚪 Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                                <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
                            </>
                        )}
                    </div>

                    {/* MOBILE: search + theme + hamburger */}
                    <div className="navbar-mobile-right">
                        <button
                            className="search-toggle-btn"
                            onClick={() => { setSearchOpen(!searchOpen); setMenuOpen(false); }}
                            aria-label={searchOpen ? "Close search" : "Search"}
                            aria-expanded={searchOpen}
                        >
                            {searchOpen ? "✕" : "🔍"}
                        </button>
                        <button className="theme-toggle" onClick={cycleTheme} aria-label={themeLabel}>
                            {themeIcon}
                        </button>
                        <button
                            className="hamburger-btn"
                            onClick={() => { setMenuOpen(!menuOpen); setSearchOpen(false); }}
                            aria-expanded={menuOpen}
                            aria-label={menuOpen ? "Close menu" : "Open menu"}
                        >
                            <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
                            <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
                            <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile search expand bar */}
            <div className={`navbar-search-expand ${searchOpen ? "open" : ""}`} aria-hidden={!searchOpen}>
                <div className="container">
                    <form className="navbar-search-expand-form" onSubmit={handleSearch}>
                        <span className="navbar-search-icon">🔍</span>
                        <input
                            type="search"
                            placeholder="Search posts, topics, tutorials..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus={searchOpen}
                            aria-label="Search"
                        />
                        {searchQuery && (
                            <button type="button" className="search-clear-btn" onClick={() => setSearchQuery("")} aria-label="Clear">
                                ✕
                            </button>
                        )}
                    </form>
                </div>
            </div>

            {/* Backdrop overlay */}
            <div
                className={`mobile-overlay ${menuOpen ? "visible" : ""}`}
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
            />

            {/* Slide-down mobile drawer */}
            <aside className={`mobile-drawer ${menuOpen ? "open" : ""}`} aria-label="Mobile navigation">
                {/* Header: user info or branding */}
                <div className="mobile-drawer-header">
                    {isLoggedIn ? (
                        <div className="mobile-user-info">
                            {user?.profilePicture
                                ? <img src={user.profilePicture} alt={user.name} className="mobile-avatar" />
                                : <div className="mobile-avatar-placeholder">{getInitials(user?.name)}</div>
                            }
                            <div>
                                <div className="mobile-user-name">{user?.name}</div>
                                <div className="mobile-user-handle">@{user?.username}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="mobile-auth-prompt">
                            <div className="logo-icon" style={{ width: 40, height: 40, fontSize: "1.1rem" }}>D</div>
                            <span className="mobile-brand-name">DevBlog</span>
                        </div>
                    )}
                </div>

                {/* Search */}
                <form className="mobile-search" onSubmit={handleSearch}>
                    <span className="mobile-search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search posts, topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search posts"
                    />
                </form>

                {/* Navigation links */}
                <nav className="mobile-nav">
                    <Link to="/" className="mobile-nav-link">🏠 Home</Link>
                    {isLoggedIn && (
                        <>
                            <Link to="/write" className="mobile-nav-link accent">✏️ Write a Story</Link>
                            <Link to={`/profile/${user?.username}`} className="mobile-nav-link">👤 My Profile</Link>
                            <Link to="/my-posts" className="mobile-nav-link">📝 My Posts</Link>
                            <Link to="/bookmarks" className="mobile-nav-link">🔖 Bookmarks</Link>
                            <Link to="/settings" className="mobile-nav-link">⚙️ Settings</Link>
                            {user?.role === "admin" && (
                                <Link to="/admin" className="mobile-nav-link">🛡️ Admin Dashboard</Link>
                            )}
                        </>
                    )}
                    <Link to="/about" className="mobile-nav-link">ℹ️ About</Link>
                    <Link to="/contact" className="mobile-nav-link">📬 Contact</Link>
                </nav>

                {/* Footer: auth actions */}
                <div className="mobile-drawer-footer">
                    {isLoggedIn ? (
                        <button className="btn btn-ghost btn-full" onClick={handleLogout}>
                            🚪 Logout
                        </button>
                    ) : (
                        <div className="mobile-auth-buttons">
                            <Link to="/login" className="btn btn-ghost">Login</Link>
                            <Link to="/register" className="btn btn-primary">Sign Up</Link>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Navbar;
