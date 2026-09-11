// ============================================================
// src/components/CommentSection.jsx — Comments Display & Form
//
// Shows all comments for a post and lets logged-in users add comments.
// Supports NESTED comments (replies) — clicking "Reply" shows a reply form.
// ============================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getComments, addComment, deleteComment } from "../api/comments";
import useAuthStore from "../store/authStore";
import { timeAgo, getInitials } from "../utils/helpers";
import toast from "react-hot-toast"; // Beautiful popup notifications

// ============================================================
// CommentItem — A single comment (renders recursively for replies)
// ============================================================
const CommentItem = ({ comment, postId, onReply, onDelete, currentUser }) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        setSubmitting(true);
        try {
            const data = await addComment(postId, replyContent, comment._id);
            onReply(data.comment); // Notify parent to add reply to list
            setReplyContent("");
            setShowReplyForm(false);
            toast.success("Reply added!");
        } catch {
            toast.error("Failed to add reply");
        } finally {
            setSubmitting(false);
        }
    };

    const isAuthor = currentUser?._id === comment.author?._id;

    return (
        <div
            style={{
                display: "flex",
                gap: "0.75rem",
                padding: "1rem 0",
                borderBottom: "1px solid var(--border-light)",
            }}
        >
            {/* Author avatar */}
            <div style={{ flexShrink: 0 }}>
                {comment.author?.profilePicture ? (
                    <img
                        src={comment.author.profilePicture}
                        alt={comment.author.name}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            objectFit: "cover",
                        }}
                    />
                ) : (
                    <Link to={`/profile/${comment.author?.username}`}>
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: "var(--accent-gradient)",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.8rem",
                                fontWeight: 700,
                                textDecoration: "none",
                            }}
                        >
                            {getInitials(comment.author?.name)}
                        </div>
                    </Link>
                )}
            </div>

            <div style={{ flex: 1 }}>
                {/* Comment header */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.375rem",
                    }}
                >
                    <Link
                        to={`/profile/${comment.author?.username}`}
                        style={{
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            color: "var(--text-primary)",
                        }}
                    >
                        {comment.author?.name}
                    </Link>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {timeAgo(comment.createdAt)}
                    </span>
                </div>

                {/* Comment content */}
                <p
                    style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.9375rem",
                        lineHeight: 1.6,
                        marginBottom: "0.5rem",
                    }}
                >
                    {comment.content}
                </p>

                {/* Comment actions */}
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    {/* Reply button — only for logged-in users */}
                    {currentUser && (
                        <button
                            onClick={() => setShowReplyForm(!showReplyForm)}
                            style={{
                                fontSize: "0.8rem",
                                color: "var(--accent-primary)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 500,
                            }}
                        >
                            💬 Reply
                        </button>
                    )}

                    {/* Delete button — only for comment author */}
                    {isAuthor && (
                        <button
                            onClick={() => onDelete(comment._id)}
                            style={{
                                fontSize: "0.8rem",
                                color: "var(--danger)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 500,
                            }}
                        >
                            🗑️ Delete
                        </button>
                    )}
                </div>

                {/* --- Reply Form --- */}
                {showReplyForm && (
                    <form
                        onSubmit={handleReplySubmit}
                        style={{ marginTop: "0.75rem" }}
                    >
                        <textarea
                            placeholder={`Reply to ${comment.author?.name}...`}
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="form-input form-textarea"
                            style={{ minHeight: 80, marginBottom: "0.5rem" }}
                        />
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                                type="submit"
                                className="btn btn-primary btn-sm"
                                disabled={submitting}
                            >
                                {submitting ? "Posting..." : "Post Reply"}
                            </button>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setShowReplyForm(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {/* --- Nested Replies --- */}
                {comment.replies?.length > 0 && (
                    <div
                        style={{
                            marginLeft: "1rem",
                            paddingLeft: "1rem",
                            borderLeft: "2px solid var(--border-color)",
                            marginTop: "0.75rem",
                        }}
                    >
                        {comment.replies.map((reply) => (
                            <CommentItem
                                key={reply._id}
                                comment={reply}
                                postId={postId}
                                onReply={onReply}
                                onDelete={onDelete}
                                currentUser={currentUser}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================
// CommentSection — Main Comment Section Component
// ============================================================
const CommentSection = ({ postId }) => {
    const { user } = useAuthStore();
    const isLoggedIn = !!user;
    const [comments, setComments] = useState([]);
    // Total comment count from the server (includes nested replies) —
    // comments.length alone would only count top-level comments.
    const [totalComments, setTotalComments] = useState(0);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Fetch comments when component loads (or postId changes)
    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        try {
            const data = await getComments(postId);
            setComments(data.comments);
            setTotalComments(data.totalComments ?? data.comments.length);
        } catch {
            toast.error("Failed to load comments");
        } finally {
            setLoading(false);
        }
    };

    // Handle new top-level comment submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const data = await addComment(postId, newComment);
            // Add new comment to the top of the list
            setComments((prev) => [{ ...data.comment, replies: [] }, ...prev]);
            setTotalComments((prev) => prev + 1);
            setNewComment("");
            toast.success("Comment posted! 🎉");
        } catch {
            toast.error("Failed to post comment");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle reply being added (from CommentItem)
    const handleReplyAdded = (newReply) => {
        // Recursively insert the reply into the correct comment's replies array.
        // Handles both direct replies to top-level comments and replies to replies.
        const insertReply = (comments) =>
            comments.map((comment) => {
                if (comment._id === newReply.parentComment) {
                    return {
                        ...comment,
                        replies: [...(comment.replies || []), newReply],
                    };
                }
                if (comment.replies?.length > 0) {
                    return { ...comment, replies: insertReply(comment.replies) };
                }
                return comment;
            });
        setComments((prev) => insertReply(prev));
        setTotalComments((prev) => prev + 1);
    };

    // Handle comment deletion (searches both top-level comments and their replies)
    const handleDelete = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;
        try {
            await deleteComment(commentId);
            // Mirror the backend's soft-delete behaviour in the UI:
            // mark as deleted (show placeholder text) rather than removing the node,
            // so any existing replies remain visible and properly indented.
            setComments((prev) =>
                prev.map((c) => {
                    if (c._id === commentId) {
                        return { ...c, content: "[This comment has been deleted]", isDeleted: true };
                    }
                    // Also soft-delete matching replies (keeps DOM structure intact)
                    const updatedReplies = c.replies?.map((r) =>
                        r._id === commentId
                            ? { ...r, content: "[This comment has been deleted]", isDeleted: true }
                            : r
                    );
                    return { ...c, replies: updatedReplies };
                })
            );
            toast.success("Comment deleted");
        } catch {
            toast.error("Failed to delete comment");
        }
    };

    return (
        <section style={{ marginTop: "3rem" }}>
            <h3
                style={{
                    fontSize: "1.375rem",
                    fontWeight: 700,
                    marginBottom: "1.5rem",
                    color: "var(--text-primary)",
                }}
            >
                💬 Comments ({totalComments})
            </h3>

            {/* New Comment Form — only for logged-in users */}
            {isLoggedIn ? (
                <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
                    <textarea
                        placeholder="Share your thoughts..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="form-input form-textarea"
                        style={{ minHeight: 100, marginBottom: "0.75rem" }}
                    />
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting || !newComment.trim()}
                    >
                        {submitting ? "Posting..." : "Post Comment"}
                    </button>
                </form>
            ) : (
                // Show login prompt for non-logged-in users
                <div
                    className="card"
                    style={{
                        textAlign: "center",
                        padding: "1.5rem",
                        marginBottom: "2rem",
                        background: "var(--accent-primary-light)",
                    }}
                >
                    <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
                        Join the conversation! Login to leave a comment.
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                        <Link to="/login" className="btn btn-primary btn-sm">
                            Login
                        </Link>
                        <Link to="/register" className="btn btn-ghost btn-sm">
                            Sign Up
                        </Link>
                    </div>
                </div>
            )}

            {/* Comments List */}
            {loading ? (
                <p style={{ color: "var(--text-muted)" }}>Loading comments...</p>
            ) : comments.length === 0 ? (
                <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>
                    No comments yet. Be the first to share your thoughts! 💭
                </p>
            ) : (
                <div>
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment._id}
                            comment={comment}
                            postId={postId}
                            onReply={handleReplyAdded}
                            onDelete={handleDelete}
                            currentUser={user}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default CommentSection;
