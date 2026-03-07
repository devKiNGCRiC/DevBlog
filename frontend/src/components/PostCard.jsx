import { Link } from "react-router-dom";
import { timeAgo, getInitials } from "../utils/helpers";

// Emoji per category for the no-image placeholder
const categoryEmoji = (cat) => {
    const map = {
        technology: "💻", programming: "⌨️", design: "🎨",
        career: "💼", tutorial: "📚", react: "⚛️",
        javascript: "🟨", python: "🐍", nodejs: "🟢",
    };
    return map[cat?.toLowerCase()] || "📝";
};

const PostCard = ({ post }) => {
    const likeCount = post.likes?.length || 0;
    const viewCount = post.views || 0;

    return (
        <article className="post-card card">
            {/* Cover image or placeholder */}
            {post.coverImage ? (
                <Link to={`/post/${post.slug}`} className="post-card-image-link">
                    <div className="post-card-image">
                        <img src={post.coverImage} alt={post.title} loading="lazy" />
                    </div>
                </Link>
            ) : (
                <Link to={`/post/${post.slug}`} className="post-card-image-link">
                    <div className="post-card-no-image">
                        {categoryEmoji(post.categories?.[0])}
                    </div>
                </Link>
            )}

            <div className="post-card-body">
                {/* Author info */}
                <div className="post-card-author">
                    <Link to={`/profile/${post.author?.username}`} className="author-link">
                        {post.author?.profilePicture ? (
                            <img src={post.author.profilePicture} alt={post.author.name} className="author-avatar-sm" />
                        ) : (
                            <div className="avatar-placeholder-sm">{getInitials(post.author?.name)}</div>
                        )}
                        <span className="author-name">{post.author?.name}</span>
                    </Link>
                    <span className="post-card-date">{timeAgo(post.createdAt)}</span>
                </div>

                {/* Title + excerpt (CSS handles truncation) */}
                <Link to={`/post/${post.slug}`} className="post-card-title-link">
                    <h2 className="post-card-title">{post.title}</h2>
                    <p className="post-card-excerpt">{post.excerpt}</p>
                </Link>

                {/* Category tags */}
                {post.categories?.length > 0 && (
                    <div className="post-card-tags">
                        {post.categories.slice(0, 3).map((cat) => (
                            <Link to={`/?category=${cat}`} key={cat} className="badge">{cat}</Link>
                        ))}
                    </div>
                )}

                {/* Stats footer */}
                <div className="post-card-footer">
                    <div className="post-card-stats">
                        <span className="stat-item">📖 {post.readTime || 1} min</span>
                        <span className="stat-item">❤️ {likeCount}</span>
                        <span className="stat-item">👁 {viewCount}</span>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default PostCard;