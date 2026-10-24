// ============================================================
// src/pages/NotificationsPage.jsx — "What happened while I was away?"
//
// Lists likes, comments, replies and new followers, newest first.
// Unread ones are highlighted. Clicking one marks it read and
// opens the post (or the follower's profile).
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from "../api/notifications";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import { timeAgo, getInitials, truncateText } from "../utils/helpers";

// What each notification type says, and where clicking it goes
const describe = (n) => {
    const postTitle = n.post?.title ? `"${truncateText(n.post.title, 60)}"` : "your post";
    switch (n.type) {
        case "like":
            return { icon: "❤️", text: `liked ${postTitle}` };
        case "comment":
            return { icon: "💬", text: `commented on ${postTitle}` };
        case "reply":
            return { icon: "↩️", text: `replied to your comment on ${postTitle}` };
        case "follow":
            return { icon: "👥", text: "started following you" };
        default:
            return { icon: "🔔", text: "sent you a notification" };
    }
};

const targetOf = (n) =>
    n.type === "follow" || !n.post?.slug ? `/profile/${n.actor.username}` : `/post/${n.post.slug}`;

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [pagination, setPagination] = useState({});
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getNotifications({ page, limit: 20 });
            setNotifications(data.notifications);
            setPagination(data.pagination);
            setUnreadCount(data.unreadCount);
        } catch {
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    const handleOpen = async (n) => {
        if (!n.read) {
            // Fire and forget — navigation shouldn't wait on this
            markNotificationRead(n._id).catch(() => {});
        }
        navigate(targetOf(n));
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch {
            toast.error("Couldn't mark notifications as read");
        }
    };

    return (
        <div className="page-wrapper">
            <Helmet><title>Notifications | DevBlog</title></Helmet>
            <div className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 720 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>
                        🔔 Notifications
                        {unreadCount > 0 && (
                            <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-muted)" }}> · {unreadCount} unread</span>
                        )}
                    </h1>
                    {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="btn btn-ghost btn-sm">✓ Mark all as read</button>
                    )}
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : notifications.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-state-icon">🔕</span>
                        <h3>No notifications yet</h3>
                        <p>When people like, comment on, or follow your work, you'll see it here.</p>
                        <Link to="/write" className="btn btn-primary">✏️ Write a post</Link>
                    </div>
                ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {notifications.map((n) => {
                            const { icon, text } = describe(n);
                            return (
                                <li key={n._id}>
                                    <button
                                        onClick={() => handleOpen(n)}
                                        className="card"
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: "0.875rem",
                                            padding: "0.875rem 1rem",
                                            textAlign: "left",
                                            cursor: "pointer",
                                            font: "inherit",
                                            color: "var(--text-primary)",
                                            background: n.read ? "var(--bg-card)" : "var(--accent-primary-light)",
                                            borderLeft: n.read ? undefined : "3px solid var(--accent-primary)",
                                        }}
                                    >
                                        {n.actor.profilePicture ? (
                                            <img src={n.actor.profilePicture} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                                        ) : (
                                            <div className="avatar-placeholder" style={{ width: 40, height: 40, flexShrink: 0 }}>
                                                {getInitials(n.actor.name)}
                                            </div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div>
                                                <span aria-hidden="true">{icon} </span>
                                                <strong>{n.actor.name}</strong> {text}
                                            </div>
                                            {n.comment?.content && (
                                                <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                                                    “{truncateText(n.comment.content, 120)}”
                                                </div>
                                            )}
                                            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                                                {timeAgo(n.createdAt)}
                                                {!n.read && <span className="sr-only"> · unread</span>}
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {!loading && (
                    <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
