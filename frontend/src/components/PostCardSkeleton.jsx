// ============================================================
// src/components/PostCardSkeleton.jsx — Skeleton placeholder for PostCard
//
// Shown while posts are loading to preserve layout and avoid
// jarring full-screen spinner flashes.
// ============================================================

const PostCardSkeleton = () => (
    <article className="post-card card" aria-hidden="true">
        {/* Image placeholder */}
        <div
            className="post-card-no-image skeleton-pulse"
            style={{ background: "var(--bg-secondary)", minHeight: "180px" }}
        />
        <div className="post-card-body">
            {/* Author row */}
            <div className="post-card-author" style={{ gap: "0.5rem" }}>
                <div className="skeleton-pulse" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                <div className="skeleton-pulse" style={{ width: 100, height: 14, borderRadius: 4 }} />
                <div className="skeleton-pulse" style={{ width: 60, height: 12, borderRadius: 4, marginLeft: "auto" }} />
            </div>

            {/* Title */}
            <div className="skeleton-pulse" style={{ width: "85%", height: 20, borderRadius: 4, marginTop: "0.75rem" }} />
            <div className="skeleton-pulse" style={{ width: "60%", height: 20, borderRadius: 4, marginTop: "0.4rem" }} />

            {/* Excerpt */}
            <div className="skeleton-pulse" style={{ width: "100%", height: 14, borderRadius: 4, marginTop: "0.75rem" }} />
            <div className="skeleton-pulse" style={{ width: "90%", height: 14, borderRadius: 4, marginTop: "0.3rem" }} />

            {/* Tags */}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                <div className="skeleton-pulse" style={{ width: 60, height: 22, borderRadius: 12 }} />
                <div className="skeleton-pulse" style={{ width: 80, height: 22, borderRadius: 12 }} />
            </div>

            {/* Footer stats */}
            <div className="post-card-footer" style={{ marginTop: "0.75rem" }}>
                <div style={{ display: "flex", gap: "1rem" }}>
                    <div className="skeleton-pulse" style={{ width: 50, height: 14, borderRadius: 4 }} />
                    <div className="skeleton-pulse" style={{ width: 40, height: 14, borderRadius: 4 }} />
                    <div className="skeleton-pulse" style={{ width: 40, height: 14, borderRadius: 4 }} />
                </div>
            </div>
        </div>
    </article>
);

export default PostCardSkeleton;
