// ============================================================
// src/pages/HomePage.jsx - Main Blog Feed
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { getAllPosts, getCategories } from "../api/posts";
import PostCard from "../components/PostCard";
import PostCardSkeleton from "../components/PostCardSkeleton";
import Pagination from "../components/Pagination";
import toast from "react-hot-toast";

// Default categories always shown — merged with any from the API
const DEFAULT_CATEGORIES = [
    "All", "Technology", "Programming", "Design", "Career",
    "Tutorial", "React", "JavaScript", "Python", "NodeJS",
];

const HomePage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const currentCategory = searchParams.get("category") || "All";
    const currentSearch   = searchParams.get("q") || "";
    const currentSort     = searchParams.get("sort") || "latest";
    const currentPage     = parseInt(searchParams.get("page") || "1");

    const [posts, setPosts]           = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading]       = useState(true);
    const [heroQuery, setHeroQuery]   = useState(currentSearch);
    // Start with default categories; merge with API results when available
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

    // Keep hero search box in sync with URL
    useEffect(() => { setHeroQuery(currentSearch); }, [currentSearch]);

    // Load categories from API once on mount — merge with defaults
    useEffect(() => {
        getCategories()
            .then((data) => {
                if (data?.categories?.length) {
                    // Capitalize first letter of each category for display
                    const fromApi = data.categories.map(
                        (c) => c.charAt(0).toUpperCase() + c.slice(1)
                    );
                    // Merge API categories with defaults, deduplicate
                    const merged = ["All", ...new Set([
                        ...DEFAULT_CATEGORIES.slice(1),
                        ...fromApi,
                    ])];
                    setCategories(merged);
                }
                // If API returns empty, keep DEFAULT_CATEGORIES (already set as initial state)
            })
            .catch(() => {
                // Keep DEFAULT_CATEGORIES on error (already set as initial state)
            });
    }, []);

    // Memoized fetchPosts — only recreated when search params change
    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, limit: 9, sortBy: currentSort };
            if (currentSearch) params.search = currentSearch;
            if (currentCategory !== "All") params.category = currentCategory.toLowerCase();
            const data = await getAllPosts(params);
            setPosts(data.posts);
            setPagination(data.pagination);
        } catch {
            toast.error("Failed to load posts. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [currentPage, currentSort, currentSearch, currentCategory]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const updateFilter = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value && value !== "All") { newParams.set(key, value); }
        else { newParams.delete(key); }
        newParams.set("page", "1");
        setSearchParams(newParams);
    };

    const handleHeroSearch = (e) => {
        e.preventDefault();
        const q = heroQuery.trim();
        const newParams = new URLSearchParams(searchParams);
        if (q) { newParams.set("q", q); } else { newParams.delete("q"); }
        newParams.set("page", "1");
        setSearchParams(newParams);
    };

    const clearFilters = () => setSearchParams({});

    const pageTitle = currentSearch
        ? `Search: "${currentSearch}" | DevBlog`
        : currentCategory !== "All"
        ? `${currentCategory} Posts | DevBlog`
        : "DevBlog — Developer Stories & Tutorials";

    return (
        <div className="page-wrapper">
            <Helmet><title>{pageTitle}</title></Helmet>
            <div className="container" style={{ paddingTop: "2rem", paddingBottom: "1rem" }}>

                {/* ---- HERO ---- */}
                <section className="hero-section">
                    <span className="hero-badge">🚀 Developer Community</span>
                    <h1 className="hero-title">
                        Where Developers{" "}
                        <span className="text-gradient">Share & Learn</span>
                    </h1>
                    <p className="hero-subtitle">
                        Discover tutorials, insights, and ideas from developers worldwide.
                    </p>
                    <form className="hero-search-form" onSubmit={handleHeroSearch}>
                        <div className="hero-search-wrapper">
                            <span className="hero-search-icon-label">🔍</span>
                            <input
                                type="text"
                                className="hero-search-input"
                                placeholder="Search posts, tutorials, topics..."
                                value={heroQuery}
                                onChange={(e) => setHeroQuery(e.target.value)}
                                aria-label="Search posts"
                            />
                        </div>
                        <button type="submit" className="hero-search-btn">Search</button>
                    </form>
                </section>

                {/* ---- FILTER BAR ---- */}
                <div className="filter-section">
                    <div className="filter-row">
                        <div className="category-pills" aria-label="Filter by category">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => updateFilter("category", cat)}
                                    className={`category-pill ${currentCategory === cat ? "active" : ""}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <select
                            value={currentSort}
                            onChange={(e) => updateFilter("sort", e.target.value)}
                            className="sort-select"
                            aria-label="Sort posts"
                        >
                            <option value="latest">🕐 Latest</option>
                            <option value="popular">🔥 Popular</option>
                            <option value="oldest">📅 Oldest</option>
                        </select>
                    </div>

                    {/* Active search info */}
                    {currentSearch && (
                        <div className="search-result-info">
                            Results for: <strong>"{currentSearch}"</strong>
                            {pagination.totalPosts !== undefined && ` — ${pagination.totalPosts} post${pagination.totalPosts !== 1 ? "s" : ""}`}
                            {" "}
                            <button
                                onClick={clearFilters}
                                style={{ background: "none", border: "none", color: "var(--accent-primary)", cursor: "pointer", fontWeight: 600, fontSize: "0.8125rem", padding: 0 }}
                            >
                                × Clear
                            </button>
                        </div>
                    )}
                </div>

                {/* ---- POSTS ---- */}
                {loading ? (
                    <div className="posts-grid">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <PostCardSkeleton key={i} />
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-state-icon">🔍</span>
                        <h3>No posts found</h3>
                        <p>Try different keywords or filters</p>
                        <button onClick={clearFilters} className="btn btn-ghost">
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="posts-grid">
                        {posts.map((post) => (
                            <PostCard key={post._id} post={post} />
                        ))}
                    </div>
                )}

                {/* ---- PAGINATION ---- */}
                {!loading && posts.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={(page) => updateFilter("page", page.toString())}
                    />
                )}
            </div>
        </div>
    );
};

export default HomePage;