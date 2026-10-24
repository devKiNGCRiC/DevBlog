// ============================================================
// src/pages/AdminDashboardPage.jsx — Admin Moderation Dashboard
//
// Only reachable by users with role: "admin" (enforced both by
// ProtectedRoute's adminOnly prop on the frontend, and by the
// "adminOnly" middleware on every /api/admin/* route on the backend —
// the frontend guard is just a UX nicety, not the real security boundary).
//
// Five tabs:
// - Overview: quick counts (users, posts, drafts, comments, open reports)
// - Reports: posts/comments flagged by users — remove the content or dismiss
// - Posts: every post in the system (published + drafts, any author)
// - Comments: every comment in the system, flat list
// - Users: every account, with the ability to promote/demote admins
//          or delete an account entirely
// ============================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import {
    getAdminStats,
    getAdminPosts,
    deleteAdminPost,
    getAdminComments,
    deleteAdminComment,
    getAdminUsers,
    updateAdminUserRole,
    deleteAdminUser,
    getAdminReports,
    reviewAdminReport,
} from "../api/admin";
import useAuthStore from "../store/authStore";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/ConfirmModal";
import LoadingSpinner from "../components/LoadingSpinner";
import { timeAgo, truncateText, getInitials } from "../utils/helpers";

const TABS = [
    { id: "overview", label: "📊 Overview" },
    { id: "reports", label: "🚩 Reports" },
    { id: "posts", label: "📝 Posts" },
    { id: "comments", label: "💬 Comments" },
    { id: "users", label: "👥 Users" },
];

const AdminDashboardPage = () => {
    const { user: currentUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState("overview");

    return (
        <div className="page-wrapper">
            <Helmet><title>Admin Dashboard | DevBlog</title></Helmet>
            <div className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                    🛡️ Admin Dashboard
                </h1>
                <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                    Moderate posts, comments, and user accounts across all of DevBlog.
                </p>

                {/* Tabs */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`btn btn-sm ${activeTab === tab.id ? "btn-primary" : "btn-ghost"}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === "overview" && <OverviewTab />}
                {activeTab === "reports" && <ReportsTab />}
                {activeTab === "posts" && <PostsTab />}
                {activeTab === "comments" && <CommentsTab />}
                {activeTab === "users" && <UsersTab currentUserId={currentUser?._id} />}
            </div>
        </div>
    );
};

// ============================================================
// OVERVIEW TAB — quick stat cards
// ============================================================
const OverviewTab = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAdminStats()
            .then((data) => setStats(data.stats))
            .catch(() => toast.error("Failed to load dashboard stats"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner />;
    if (!stats) return null;

    const cards = [
        { label: "Total Users", value: stats.userCount, icon: "👥" },
        { label: "Admins", value: stats.adminCount, icon: "🛡️" },
        { label: "Total Posts", value: stats.postCount, icon: "📝" },
        { label: "Published", value: stats.publishedCount, icon: "✅" },
        { label: "Drafts", value: stats.draftCount, icon: "📄" },
        { label: "Comments", value: stats.commentCount, icon: "💬" },
        { label: "Open Reports", value: stats.openReportCount, icon: "🚩" },
    ];

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
            {cards.map((c) => (
                <div key={c.label} className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
                    <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{c.icon}</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>{c.value}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{c.label}</div>
                </div>
            ))}
        </div>
    );
};

// ============================================================
// POSTS TAB — every post in the system
// ============================================================
const PostsTab = () => {
    const [posts, setPosts] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }
    const [searchInput, setSearchInput] = useState("");
    // Bundling page + filters into one query object means every user action
    // (search, filter change, page change) triggers exactly one state update
    // and therefore exactly one fetch — no stale-page double-fetch bug.
    const [query, setQuery] = useState({ page: 1, search: "", published: "" });

    useEffect(() => {
        setLoading(true);
        getAdminPosts(query)
            .then((data) => { setPosts(data.posts); setPagination(data.pagination || {}); })
            .catch(() => toast.error("Failed to load posts"))
            .finally(() => setLoading(false));
    }, [query]);

    const handleSearch = (e) => {
        e.preventDefault();
        setQuery((q) => ({ ...q, page: 1, search: searchInput.trim() }));
    };

    const handleFilterChange = (published) => {
        setQuery((q) => ({ ...q, page: 1, published }));
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteAdminPost(deleteTarget.id);
            setPosts((prev) => prev.filter((p) => p._id !== deleteTarget.id));
            toast.success("Post removed");
        } catch {
            toast.error("Failed to delete post");
        } finally {
            setDeleteTarget(null);
        }
    };

    return (
        <div>
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 220, display: "flex", gap: "0.5rem" }}>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by title..."
                        className="form-input"
                    />
                    <button type="submit" className="btn btn-outline btn-sm">Search</button>
                </form>
                <select
                    value={query.published}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="form-input"
                    style={{ maxWidth: 160 }}
                >
                    <option value="">All Posts</option>
                    <option value="true">Published</option>
                    <option value="false">Drafts</option>
                </select>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : posts.length === 0 ? (
                <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>No posts found.</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {posts.map((post) => (
                        <div key={post._id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                    {post.isPublished ? (
                                        <Link to={`/post/${post.slug}`} style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                            {post.title}
                                        </Link>
                                    ) : (
                                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{post.title}</span>
                                    )}
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
                                    by {post.author ? `${post.author.name} (@${post.author.username})` : "Unknown author"} · {timeAgo(post.createdAt)}
                                </div>
                            </div>
                            <button
                                onClick={() => setDeleteTarget({ id: post._id, title: post.title })}
                                className="btn btn-sm"
                                style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)" }}
                            >
                                🗑️ Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Pagination
                currentPage={query.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
            />

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete this post?"
                message={`"${deleteTarget?.title}" and all of its comments will be permanently removed.`}
                confirmLabel="Yes, Delete"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

// ============================================================
// REPORTS TAB — content flagged by users
//
// "Remove" deletes the post (or soft-deletes the comment);
// "Dismiss" keeps it. Either way, every open report on that same
// post/comment is closed, so the list is refetched afterwards.
// ============================================================
const REPORT_STATUSES = ["open", "resolved", "dismissed"];

const ReportsTab = () => {
    const [reports, setReports] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("open");
    const [page, setPage] = useState(1);
    const [removeTarget, setRemoveTarget] = useState(null); // report awaiting "remove" confirmation
    const [reloadKey, setReloadKey] = useState(0); // bump to refetch

    useEffect(() => {
        setLoading(true);
        getAdminReports({ page, limit: 20, status })
            .then((data) => { setReports(data.reports); setPagination(data.pagination || {}); })
            .catch(() => toast.error("Failed to load reports"))
            .finally(() => setLoading(false));
    }, [page, status, reloadKey]);

    const review = async (report, action) => {
        try {
            const data = await reviewAdminReport(report._id, action);
            toast.success(data.message);
            setReloadKey((k) => k + 1);
        } catch {
            toast.error("Failed to update report");
        } finally {
            setRemoveTarget(null);
        }
    };

    return (
        <div>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                {REPORT_STATUSES.map((s) => (
                    <button
                        key={s}
                        onClick={() => { setStatus(s); setPage(1); }}
                        className={`btn btn-sm ${status === s ? "btn-primary" : "btn-ghost"}`}
                        style={{ textTransform: "capitalize" }}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : reports.length === 0 ? (
                <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>
                    {status === "open" ? "🎉 No open reports — all clear." : `No ${status} reports.`}
                </p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {reports.map((report) => {
                        const isComment = !!report.comment;
                        const offender = isComment ? report.comment?.author : report.post?.author;
                        return (
                            <div key={report._id} className="card" style={{ padding: "1rem" }}>
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                                    <span className="badge">{isComment ? "💬 Comment" : "📝 Post"}</span>
                                    <span className="badge" style={{ textTransform: "capitalize" }}>{report.reason}</span>
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                        reported by {report.reporter ? `@${report.reporter.username}` : "a deleted user"} · {timeAgo(report.createdAt)}
                                    </span>
                                </div>

                                {isComment ? (
                                    <p style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                                        “{truncateText(report.comment?.content || "[comment no longer exists]", 200)}”
                                    </p>
                                ) : null}
                                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                                    {isComment ? "On " : ""}
                                    {report.post ? (
                                        <Link to={`/post/${report.post.slug}`} style={{ color: "var(--accent-primary)" }}>{report.post.title}</Link>
                                    ) : "a deleted post"}
                                    {offender && <> · by @{offender.username}</>}
                                </div>
                                {report.details && (
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontStyle: "italic", marginBottom: "0.5rem" }}>
                                        Reporter's note: {report.details}
                                    </p>
                                )}

                                {report.status === "open" && (
                                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                        <button onClick={() => review(report, "dismiss")} className="btn btn-ghost btn-sm">
                                            ✓ Dismiss
                                        </button>
                                        <button
                                            onClick={() => setRemoveTarget(report)}
                                            className="btn btn-sm"
                                            style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)" }}
                                        >
                                            🗑️ Remove {isComment ? "comment" : "post"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />

            <ConfirmModal
                isOpen={!!removeTarget}
                title={removeTarget?.comment ? "Remove this comment?" : "Remove this post?"}
                message={
                    removeTarget?.comment
                        ? "The comment will be replaced with a 'removed by moderator' placeholder."
                        : "The post and all its comments will be permanently deleted."
                }
                confirmLabel="Yes, Remove"
                onConfirm={() => review(removeTarget, "remove")}
                onCancel={() => setRemoveTarget(null)}
            />
        </div>
    );
};

// ============================================================
// COMMENTS TAB — every comment in the system, flat list
// ============================================================
const CommentsTab = () => {
    const [comments, setComments] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null); // comment id
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        getAdminComments({ page, limit: 20 })
            .then((data) => { setComments(data.comments); setPagination(data.pagination || {}); })
            .catch(() => toast.error("Failed to load comments"))
            .finally(() => setLoading(false));
    }, [page]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteAdminComment(deleteTarget);
            setComments((prev) => prev.filter((c) => c._id !== deleteTarget));
            toast.success("Comment removed");
        } catch {
            toast.error("Failed to delete comment");
        } finally {
            setDeleteTarget(null);
        }
    };

    return (
        <div>
            {loading ? (
                <LoadingSpinner />
            ) : comments.length === 0 ? (
                <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>No comments found.</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {comments.map((comment) => (
                        <div key={comment._id} className="card" style={{ padding: "1rem" }}>
                            <p style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                                {truncateText(comment.content, 200)}
                            </p>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                    by {comment.author ? `@${comment.author.username}` : "Unknown"} on{" "}
                                    {comment.post ? (
                                        <Link to={`/post/${comment.post.slug}`} style={{ color: "var(--accent-primary)" }}>
                                            {comment.post.title}
                                        </Link>
                                    ) : "a deleted post"} · {timeAgo(comment.createdAt)}
                                </div>
                                <button
                                    onClick={() => setDeleteTarget(comment._id)}
                                    className="btn btn-sm"
                                    style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)" }}
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
            />

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete this comment?"
                message="This comment will be replaced with a 'removed by moderator' placeholder so replies keep their context."
                confirmLabel="Yes, Delete"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

// ============================================================
// USERS TAB — every account, with promote/demote and delete
// ============================================================
const UsersTab = ({ currentUserId }) => {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState("");
    const [query, setQuery] = useState({ page: 1, search: "" });
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, username }

    useEffect(() => {
        setLoading(true);
        getAdminUsers(query)
            .then((data) => { setUsers(data.users); setPagination(data.pagination || {}); })
            .catch(() => toast.error("Failed to load users"))
            .finally(() => setLoading(false));
    }, [query]);

    const handleSearch = (e) => {
        e.preventDefault();
        setQuery((q) => ({ ...q, page: 1, search: searchInput.trim() }));
    };

    const handleRoleToggle = async (targetUser) => {
        const newRole = targetUser.role === "admin" ? "user" : "admin";
        try {
            await updateAdminUserRole(targetUser._id, newRole);
            setUsers((prev) =>
                prev.map((u) => (u._id === targetUser._id ? { ...u, role: newRole } : u))
            );
            toast.success(`${targetUser.username} is now ${newRole === "admin" ? "an admin" : "a regular user"}`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update role");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteAdminUser(deleteTarget.id);
            setUsers((prev) => prev.filter((u) => u._id !== deleteTarget.id));
            toast.success("User and their content have been removed");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete user");
        } finally {
            setDeleteTarget(null);
        }
    };

    return (
        <div>
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", maxWidth: 420 }}>
                <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by name, username, or email..."
                    className="form-input"
                />
                <button type="submit" className="btn btn-outline btn-sm">Search</button>
            </form>

            {loading ? (
                <LoadingSpinner />
            ) : users.length === 0 ? (
                <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>No users found.</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {users.map((u) => {
                        const isSelf = u._id === currentUserId;
                        return (
                            <div key={u._id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", flexWrap: "wrap" }}>
                                {u.profilePicture ? (
                                    <img src={u.profilePicture} alt={u.name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                                ) : (
                                    <div style={{
                                        width: 40, height: 40, borderRadius: "50%", background: "var(--accent-gradient)",
                                        color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem",
                                    }}>
                                        {getInitials(u.name)}
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <Link to={`/profile/${u.username}`} style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                            {u.name}
                                        </Link>
                                        <span
                                            style={{
                                                fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.5rem",
                                                borderRadius: "var(--radius-full)",
                                                background: u.role === "admin" ? "rgba(99, 102, 241, 0.12)" : "var(--bg-secondary)",
                                                color: u.role === "admin" ? "var(--accent-primary)" : "var(--text-muted)",
                                            }}
                                        >
                                            {u.role === "admin" ? "Admin" : "User"}
                                        </span>
                                        {isSelf && (
                                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>(you)</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                        @{u.username} · {u.email}
                                    </div>
                                </div>
                                {!isSelf && (
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                        <button onClick={() => handleRoleToggle(u)} className="btn btn-ghost btn-sm">
                                            {u.role === "admin" ? "Demote" : "Promote"}
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget({ id: u._id, username: u.username })}
                                            className="btn btn-sm"
                                            style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)" }}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <Pagination
                currentPage={query.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
            />

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete this account?"
                message={`@${deleteTarget?.username} and everything they've posted (posts, comments, likes, follows) will be permanently removed.`}
                confirmLabel="Yes, Delete"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default AdminDashboardPage;
