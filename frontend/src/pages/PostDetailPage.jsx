// ============================================================
// src/pages/PostDetailPage.jsx — Full Blog Post View
//
// Shows the complete blog post: cover image, title, content,
// author info, like/bookmark buttons, and comments section.
// ============================================================

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DOMPurify from "dompurify"; // Security: sanitizes HTML to prevent XSS attacks
import { getPostBySlug, likePost, bookmarkPost, deletePost, getRelatedPosts } from "../api/posts";
import CommentSection from "../components/CommentSection";
import PostCard from "../components/PostCard";
import ReadingProgress from "../components/ReadingProgress";
import TableOfContents from "../components/TableOfContents";
import ShareButtons from "../components/ShareButtons";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmModal from "../components/ConfirmModal";
import useAuthStore from "../store/authStore";
import { formatDate, getInitials, addHeadingIds } from "../utils/helpers";
import toast from "react-hot-toast";

const PostDetailPage = () => {
    const { slug } = useParams(); // Get :slug from the URL
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isLoggedIn = !!user;

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false); // Has current user liked this?
    const [bookmarked, setBookmarked] = useState(false); // Has current user bookmarked?
    const [likeCount, setLikeCount] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const articleRef = useRef(null); // The post body — drives the reading progress bar

    // DOMPurify.sanitize() removes any dangerous scripts from HTML
    // This protects users from XSS (Cross-Site Scripting) attacks.
    // Then headings get ids for the table of contents. Memoised so the
    // HTML isn't re-parsed on every like/bookmark click.
    const { html: contentHtml, headings } = useMemo(
        () => (post ? addHeadingIds(DOMPurify.sanitize(post.content)) : { html: "", headings: [] }),
        [post]
    );

    useEffect(() => {
        fetchPost();
        // Scroll to top when a new post is opened
        window.scrollTo(0, 0);
    }, [slug]);

    // Re-compute liked/bookmarked when user logs in or out while staying on the same post
    useEffect(() => {
        if (!post) return;
        if (user) {
            setLiked(post.likes?.some((l) => String(l._id) === String(user._id)));
            setBookmarked(post.bookmarks?.some((b) => String(b._id) === String(user._id)));
        } else {
            setLiked(false);
            setBookmarked(false);
        }
    }, [user, post]);

    const fetchPost = async () => {
        setLoading(true);
        try {
            const data = await getPostBySlug(slug);
            setPost(data.post);

            // Check if the current user has liked/bookmarked this post
            if (user) {
                // Use String() to normalise ObjectId vs plain string comparison
                setLiked(data.post.likes?.some((l) => String(l._id) === String(user._id)));
                setBookmarked(data.post.bookmarks?.some((b) => String(b._id) === String(user._id)));
            }
            setLikeCount(data.post.likes?.length || 0);

            // Related posts are a nice-to-have — never block the page on them
            setRelatedPosts([]);
            getRelatedPosts(data.post._id)
                .then((related) => setRelatedPosts(related.posts))
                .catch(() => {});
        } catch {
            toast.error("Post not found or unavailable");
            navigate("/"); // Redirect home if post doesn't exist
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!isLoggedIn) {
            toast("Please login to like posts", { icon: "🔐" });
            return;
        }
        try {
            const data = await likePost(post._id);
            setLiked(data.liked);
            // Update like count locally (without refetching)
            setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
        } catch {
            toast.error("Failed to like post");
        }
    };

    const handleBookmark = async () => {
        if (!isLoggedIn) {
            toast("Please login to bookmark posts", { icon: "🔐" });
            return;
        }
        try {
            const data = await bookmarkPost(post._id);
            setBookmarked(data.bookmarked);
            toast.success(data.bookmarked ? "Post bookmarked! 🔖" : "Bookmark removed");
        } catch {
            toast.error("Failed to bookmark post");
        }
    };

    const handleDelete = async () => {
        try {
            await deletePost(post._id);
            toast.success("Post deleted");
            navigate("/");
        } catch {
            toast.error("Failed to delete post");
        }
    };

    if (loading) return <LoadingSpinner fullPage />;
    if (!post) return null;

    // Use String() to normalise ObjectId vs plain string comparison
    const isAuthor = String(user?._id) === String(post.author?._id);

    // Canonical link to this post — used for sharing and Open Graph tags
    const postUrl = `${window.location.origin}/post/${post.slug}`;

    return (
        <div className="page-wrapper">
            <Helmet>
                <title>{post.title} | DevBlog</title>
                {post.excerpt && <meta name="description" content={post.excerpt} />}
                <link rel="canonical" href={postUrl} />
                {/* Open Graph (Facebook, LinkedIn, Slack...) and Twitter card previews */}
                <meta property="og:type" content="article" />
                <meta property="og:site_name" content="DevBlog" />
                <meta property="og:title" content={post.title} />
                <meta property="og:url" content={postUrl} />
                {post.excerpt && <meta property="og:description" content={post.excerpt} />}
                {post.coverImage && <meta property="og:image" content={post.coverImage} />}
                {post.publishedAt && <meta property="article:published_time" content={post.publishedAt} />}
                {post.author?.name && <meta property="article:author" content={post.author.name} />}
                <meta name="twitter:card" content={post.coverImage ? "summary_large_image" : "summary"} />
                <meta name="twitter:title" content={post.title} />
                {post.excerpt && <meta name="twitter:description" content={post.excerpt} />}
                {post.coverImage && <meta name="twitter:image" content={post.coverImage} />}
            </Helmet>
            <ReadingProgress targetRef={articleRef} />
            <div className="container" style={{ paddingTop: "2rem", maxWidth: 780 }}>
                {/* ---- CATEGORIES ---- */}
                {post.categories?.length > 0 && (
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                        {post.categories.map((cat) => (
                            <Link to={`/?category=${cat}`} key={cat} className="badge">
                                {cat}
                            </Link>
                        ))}
                    </div>
                )}

                {/* ---- POST TITLE ---- */}
                <h1
                    style={{
                        fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                        fontWeight: 800,
                        lineHeight: 1.2,
                        marginBottom: "1.5rem",
                        color: "var(--text-primary)",
                    }}
                >
                    {post.title}
                </h1>

                {/* ---- AUTHOR INFO & ACTIONS ROW ---- */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "2rem",
                        flexWrap: "wrap",
                        gap: "1rem",
                    }}
                >
                    {/* Author */}
                    <Link
                        to={`/profile/${post.author?.username}`}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            textDecoration: "none",
                        }}
                    >
                        {post.author?.profilePicture ? (
                            <img
                                src={post.author.profilePicture}
                                alt={post.author.name}
                                style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: 44, height: 44, borderRadius: "50%",
                                    background: "var(--accent-gradient)", color: "white",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontWeight: 700
                                }}
                            >
                                {getInitials(post.author?.name)}
                            </div>
                        )}
                        <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                {post.author?.name}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                {formatDate(post.publishedAt || post.createdAt)} ·{" "}
                                {post.readTime} min read · 👁️ {post.views} views
                            </div>
                        </div>
                    </Link>

                    {/* Edit/Delete (only for author) */}
                    {isAuthor && (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <Link
                                to={`/edit/${post._id}`}
                                className="btn btn-ghost btn-sm"
                            >
                                ✏️ Edit
                            </Link>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="btn btn-danger btn-sm"
                            >
                                🗑️ Delete
                            </button>
                        </div>
                    )}
                </div>

                {/* ---- COVER IMAGE ---- */}
                {post.coverImage && (
                    <div
                        style={{
                            borderRadius: "var(--radius-lg)",
                            overflow: "hidden",
                            marginBottom: "2rem",
                            boxShadow: "var(--shadow-md)",
                        }}
                    >
                        <img
                            src={post.coverImage}
                            alt={post.title}
                            style={{ width: "100%", maxHeight: 480, objectFit: "cover" }}
                        />
                    </div>
                )}

                {/* ---- LIKE / BOOKMARK / SHARE ACTIONS ---- */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "1rem 0",
                        borderTop: "1px solid var(--border-color)",
                        borderBottom: "1px solid var(--border-color)",
                        marginBottom: "2rem",
                    }}
                >
                    {/* Like Button */}
                    <button
                        onClick={handleLike}
                        className="btn btn-ghost btn-sm"
                        style={{ color: liked ? "var(--danger)" : "var(--text-secondary)" }}
                    >
                        {liked ? "❤️" : "🤍"} {likeCount}
                    </button>

                    {/* Bookmark Button */}
                    <button
                        onClick={handleBookmark}
                        className="btn btn-ghost btn-sm"
                        style={{ color: bookmarked ? "var(--accent-primary)" : "var(--text-secondary)" }}
                    >
                        {bookmarked ? "🔖" : "📑"} Save
                    </button>

                    {/* Tags */}
                    <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {post.tags?.map((tag) => (
                            <Link
                                to={`/?tag=${tag}`}
                                key={tag}
                                className="badge"
                                style={{ fontSize: "0.75rem" }}
                            >
                                #{tag}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ---- POST CONTENT (Rich Text / HTML) ---- */}
                {/* 
          We render the HTML content from the rich text editor.
          We MUST sanitize it first (DOMPurify) to prevent XSS attacks!
          "dangerouslySetInnerHTML" is React's way to render raw HTML.
          It's called "dangerously" to remind developers to sanitize first.
        */}
                <TableOfContents headings={headings} />
                <div
                    ref={articleRef}
                    className="prose"
                    style={{ margin: "0 auto" }}
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                />

                {/* ---- SHARE ---- */}
                <div style={{ marginTop: "2.5rem" }}>
                    <ShareButtons title={post.title} url={postUrl} />
                </div>

                {/* ---- RELATED POSTS ---- */}
                {relatedPosts.length > 0 && (
                    <section style={{ marginTop: "3rem" }} aria-labelledby="related-heading">
                        <h2 id="related-heading" style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
                            📚 Related posts
                        </h2>
                        <div className="posts-grid">
                            {relatedPosts.map((related) => (
                                <PostCard key={related._id} post={related} />
                            ))}
                        </div>
                    </section>
                )}

                {/* ---- COMMENTS SECTION ---- */}
                <hr className="divider" style={{ marginTop: "3rem" }} />
                <CommentSection postId={post._id} />

                {/* Bottom padding */}
                <div style={{ height: "4rem" }} />
            </div>

            {/* Delete confirmation modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="Delete Post?"
                message="This action cannot be undone. All comments will also be removed."
                confirmLabel="Yes, Delete"
                onConfirm={() => { setShowDeleteConfirm(false); handleDelete(); }}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
};

export default PostDetailPage;
