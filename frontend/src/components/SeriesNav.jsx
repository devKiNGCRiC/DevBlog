// ============================================================
// src/components/SeriesNav.jsx — "Part 2 of 5 in Learning Node"
//
// Shown on a post that belongs to a series: lists every part
// (current one highlighted) with Previous / Next links.
// ============================================================

import { Link } from "react-router-dom";

const SeriesNav = ({ seriesNav, currentSlug }) => {
    if (!seriesNav || seriesNav.parts.length === 0) return null;

    const { title, parts } = seriesNav;
    const index = parts.findIndex((p) => p.slug === currentSlug);
    const prev = index > 0 ? parts[index - 1] : null;
    const next = index >= 0 && index < parts.length - 1 ? parts[index + 1] : null;

    return (
        <nav
            aria-label={`Series: ${title}`}
            style={{
                border: "1px solid var(--border-color)",
                borderLeft: "4px solid var(--accent-primary)",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-card)",
                padding: "1rem 1.25rem",
                marginBottom: "2rem",
            }}
        >
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                📚 Series{index >= 0 && ` · Part ${index + 1} of ${parts.length}`}
            </div>
            <div style={{ fontWeight: 700, fontSize: "1.0625rem", margin: "0.25rem 0 0.75rem" }}>{title}</div>

            <ol style={{ margin: "0 0 0.75rem 1.25rem", padding: 0 }}>
                {parts.map((part, i) => (
                    <li key={part._id} style={{ margin: "0.25rem 0" }}>
                        {i === index ? (
                            <strong aria-current="page">{part.title}</strong>
                        ) : (
                            <Link to={`/post/${part.slug}`} style={{ color: "var(--text-secondary)" }}>{part.title}</Link>
                        )}
                    </li>
                ))}
            </ol>

            {(prev || next) && (
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                    {prev ? <Link to={`/post/${prev.slug}`} className="btn btn-ghost btn-sm">← Previous</Link> : <span />}
                    {next && <Link to={`/post/${next.slug}`} className="btn btn-ghost btn-sm">Next →</Link>}
                </div>
            )}
        </nav>
    );
};

export default SeriesNav;
