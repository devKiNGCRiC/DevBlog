// ============================================================
// src/pages/StatsPage.jsx — Author analytics
//
// - Stat tiles: total views, likes, comments, bookmarks, followers
// - Bar chart: daily engagement (likes + comments + follows), last 30 days
// - Table: per-post numbers, most viewed first
// ============================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { getMyStats } from "../api/posts";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatCount } from "../utils/helpers";

const CHART_HEIGHT = 160; // px

// "2026-10-24" → "Oct 24" (the date is UTC, so format it in UTC too)
const shortDate = (iso) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString([], { month: "short", day: "numeric", timeZone: "UTC" });

const StatTile = ({ icon, label, value, note }) => (
    <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }} aria-hidden="true">{icon}</div>
        <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>{formatCount(value)}</div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{label}</div>
        {note && <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.25rem" }}>{note}</div>}
    </div>
);

// Single-series bar chart. Hover or focus a day to see its breakdown.
const ActivityChart = ({ activity }) => {
    const [active, setActive] = useState(null); // index of hovered/focused day
    const days = activity.map((d) => ({ ...d, total: d.likes + d.comments + d.follows }));
    const max = Math.max(1, ...days.map((d) => d.total));
    const hasActivity = days.some((d) => d.total > 0);
    const shown = active !== null ? days[active] : null;

    return (
        <div>
            {/* Tooltip row — fixed height so the chart doesn't jump */}
            <div style={{ minHeight: "1.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }} aria-live="polite">
                {shown
                    ? <><strong style={{ color: "var(--text-primary)" }}>{shortDate(shown.date)}</strong> · {shown.likes} likes · {shown.comments} comments · {shown.follows} follows</>
                    : hasActivity ? "Hover a bar to see that day" : "No likes, comments or follows in the last 30 days yet."}
            </div>

            <div
                role="group"
                aria-label="Daily engagement, last 30 days"
                style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 2, // 2px gap between adjacent bars
                    height: CHART_HEIGHT,
                    borderBottom: "1px solid var(--border-color)", // baseline
                }}
                onMouseLeave={() => setActive(null)}
            >
                {days.map((d, i) => (
                    <button
                        key={d.date}
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onFocus={() => setActive(i)}
                        onBlur={() => setActive(null)}
                        aria-label={`${shortDate(d.date)}: ${d.total} interactions`}
                        // The whole column is the hit target, not just the (possibly tiny) bar
                        style={{
                            flex: 1,
                            height: "100%",
                            display: "flex",
                            alignItems: "flex-end",
                            padding: 0,
                            border: "none",
                            background: active === i ? "var(--bg-tertiary)" : "transparent",
                            cursor: "default",
                        }}
                    >
                        <span
                            style={{
                                display: "block",
                                width: "100%",
                                height: d.total ? `${Math.max(3, (d.total / max) * 100)}%` : 0,
                                background: "var(--accent-primary)",
                                borderRadius: "4px 4px 0 0", // rounded data-end, flat on the baseline
                                opacity: active === null || active === i ? 1 : 0.55,
                            }}
                        />
                    </button>
                ))}
            </div>

            {/* Sparse x-axis labels: first, middle, last */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                <span>{shortDate(days[0].date)}</span>
                <span>{shortDate(days[Math.floor(days.length / 2)].date)}</span>
                <span>{shortDate(days[days.length - 1].date)}</span>
            </div>

            <details style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
                <summary style={{ cursor: "pointer", color: "var(--text-secondary)" }}>Show as table</summary>
                <table style={{ width: "100%", marginTop: "0.5rem", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ textAlign: "right", color: "var(--text-muted)" }}>
                            <th style={{ textAlign: "left" }}>Day</th><th>Likes</th><th>Comments</th><th>Follows</th>
                        </tr>
                    </thead>
                    <tbody>
                        {days.filter((d) => d.total > 0).map((d) => (
                            <tr key={d.date} style={{ textAlign: "right" }}>
                                <td style={{ textAlign: "left" }}>{shortDate(d.date)}</td>
                                <td>{d.likes}</td><td>{d.comments}</td><td>{d.follows}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </div>
    );
};

const StatsPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMyStats()
            .then(setStats)
            .catch(() => toast.error("Failed to load your stats"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner fullPage />;
    if (!stats) return null;

    const { totals, posts, activity } = stats;
    const cellStyle = { padding: "0.6rem 0.5rem", textAlign: "right", whiteSpace: "nowrap" };

    return (
        <div className="page-wrapper">
            <Helmet><title>Your Stats | DevBlog</title></Helmet>
            <div className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 960 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>📈 Your Stats</h1>
                    <Link to="/my-posts" className="btn btn-ghost btn-sm">📝 My Posts</Link>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                    <StatTile icon="👁️" label="Total views" value={totals.views} note={`${totals.viewsLast24h} in the last 24h`} />
                    <StatTile icon="❤️" label="Likes" value={totals.likes} />
                    <StatTile icon="💬" label="Comments" value={totals.comments} />
                    <StatTile icon="🔖" label="Bookmarks" value={totals.bookmarks} />
                    <StatTile icon="👥" label="Followers" value={totals.followers} />
                    <StatTile icon="📝" label="Published posts" value={totals.published} note={`${totals.posts} total`} />
                </div>

                <section className="card" style={{ padding: "1.25rem", marginBottom: "2rem" }} aria-labelledby="activity-heading">
                    <h2 id="activity-heading" style={{ fontSize: "1.125rem", fontWeight: 700 }}>Daily engagement — last 30 days</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                        Likes, comments and new followers per day (UTC).
                    </p>
                    <ActivityChart activity={activity} />
                </section>

                <section aria-labelledby="posts-heading">
                    <h2 id="posts-heading" style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.75rem" }}>Per post</h2>
                    {posts.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-state-icon">📝</span>
                            <h3>No posts yet</h3>
                            <Link to="/write" className="btn btn-primary">✏️ Write your first post</Link>
                        </div>
                    ) : (
                        <div className="card" style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                                <thead>
                                    <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)" }}>
                                        <th style={{ ...cellStyle, textAlign: "left" }}>Post</th>
                                        <th style={cellStyle}>Views</th>
                                        <th style={cellStyle}>Last 24h</th>
                                        <th style={cellStyle}>Likes</th>
                                        <th style={cellStyle}>Comments</th>
                                        <th style={cellStyle}>Bookmarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {posts.map((p) => {
                                        const isLive = p.isPublished && !(p.scheduledAt && new Date(p.scheduledAt) > new Date());
                                        return (
                                            <tr key={p._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                                <td style={{ ...cellStyle, textAlign: "left", whiteSpace: "normal", minWidth: 200 }}>
                                                    <Link to={isLive ? `/post/${p.slug}` : `/edit/${p._id}`} style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                                                        {p.title}
                                                    </Link>
                                                    {!isLive && <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}> · {p.isPublished ? "scheduled" : "draft"}</span>}
                                                </td>
                                                <td style={cellStyle}>{formatCount(p.views)}</td>
                                                <td style={cellStyle}>{p.viewsLast24h}</td>
                                                <td style={cellStyle}>{p.likes}</td>
                                                <td style={cellStyle}>{p.comments}</td>
                                                <td style={cellStyle}>{p.bookmarks}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default StatsPage;
