// ============================================================
// src/pages/BookmarksPage.jsx — User's Bookmarked Posts
// ============================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBookmarkedPosts } from "../api/posts";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import toast from "react-hot-toast";

const BookmarksPage = () => {
    const [posts, setPosts] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchBookmarks();
    }, [currentPage]);

    const fetchBookmarks = async () => {
        setLoading(true);
        try {
            const data = await getBookmarkedPosts({ page: currentPage, limit: 9 });
            setPosts(data.posts);
            setPagination(data.pagination);
        } catch {
            toast.error("Failed to load bookmarks");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: "2rem" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                    🔖 Your Bookmarks
                </h1>
                <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
                    Posts you've saved for later reading
                </p>

                {loading ? (
                    <LoadingSpinner fullPage />
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "4rem 0" }}>
                        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📑</div>
                        <h3 style={{ color: "var(--text-secondary)" }}>No bookmarks yet</h3>
                        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                            Save posts you want to read later
                        </p>
                        <Link to="/" className="btn btn-primary">
                            Browse Posts
                        </Link>
                    </div>
                ) : (
                    <>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
                            {posts.map((post) => (
                                <PostCard key={post._id} post={post} />
                            ))}
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default BookmarksPage;
