// ============================================================
// src/pages/MyPostsPage.jsx — Current User's Post Manager
//
// Shows all posts (including drafts) for the logged-in user.
// Allows editing and deleting posts from this dashboard view.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getMyPosts, deletePost } from "../api/posts";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/ConfirmModal";
import { timeAgo } from "../utils/helpers";
import toast from "react-hot-toast";

const MyPostsPage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // "all", "published", "draft"
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }
    // Tracks when a page reset is caused by the filter changing, so the
    // currentPage effect doesn't also fire a duplicate fetch for the old page.
    const isFilterChangingRef = useRef(false);

    useEffect(() => {
        isFilterChangingRef.current = true;
        setCurrentPage(1);
        fetchMyPosts(1);
    }, [filter]);

    useEffect(() => {
        if (isFilterChangingRef.current) {
            // This currentPage change was triggered by a filter change;
            // the filter effect already fetched page 1 — skip this run.
            isFilterChangingRef.current = false;
            return;
        }
        fetchMyPosts(currentPage);
    }, [currentPage]);

    const fetchMyPosts = async (page = currentPage) => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (filter === "published") params.published = "true";
            if (filter === "draft") params.published = "false";
            const data = await getMyPosts(params);
            setPosts(data.posts);
            setPagination(data.pagination || {});
        } catch {
            toast.error("Failed to load your posts");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deletePost(deleteTarget.id);
            setPosts((prev) => prev.filter((p) => p._id !== deleteTarget.id));
            toast.success("Post deleted");
        } catch {
            toast.error("Failed to delete post");
        } finally {
            setDeleteTarget(null);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: "2rem" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                    <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>📝 My Posts</h1>
                    <Link to="/write" className="btn btn-primary">
                        + New Post
                    </Link>
                </div>

                {/* Filter tabs */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                    {["all", "published", "draft"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`}
                            style={{ textTransform: "capitalize" }}
                        >
                            {f === "all" ? "All Posts" : f === "published" ? "✅ Published" : "📝 Drafts"}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <LoadingSpinner fullPage />
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "4rem 0" }}>
                        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✍️</div>
                        <h3 style={{ color: "var(--text-secondary)" }}>No posts yet</h3>
                        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                            Start writing your story!
                        </p>
                        <Link to="/write" className="btn btn-primary">
                            Write your first post
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {posts.map((post) => (
                            <div key={post._id} className="card" style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                                {/* Cover thumbnail */}
                                {post.coverImage && (
                                    <img
                                        src={post.coverImage}
                                        alt={post.title}
                                        style={{ width: 80, height: 65, borderRadius: "var(--radius-md)", objectFit: "cover", flexShrink: 0 }}
                                    />
                                )}

                                {/* Post Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                        <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>
                                            <Link to={post.isPublished ? `/post/${post.slug}` : `/edit/${post._id}`} style={{ color: "var(--text-primary)" }}>
                                                {post.title}
                                            </Link>
                                        </h3>
                                        {/* Status badge */}
                                        <span
                                            style={{
                                                fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.5rem",
                                                borderRadius: "var(--radius-full)",
                                                background: post.isPublished ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                                                color: post.isPublished ? "var(--success)" : "var(--warning)",
                                            }}
                                        >
                                            {post.isPublished ? "Published" : "Draft"}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                        {timeAgo(post.createdAt)} · 👁️ {post.views} views · ❤️ {post.likes?.length || 0}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <Link to={`/edit/${post._id}`} className="btn btn-ghost btn-sm">
                                        ✏️ Edit
                                    </Link>
                                    <button
                                        onClick={() => setDeleteTarget({ id: post._id, title: post.title })}
                                        className="btn btn-sm"
                                        style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)" }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <Pagination
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete Post?"
                message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
                confirmLabel="Yes, Delete"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default MyPostsPage;
