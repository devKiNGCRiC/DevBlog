// ============================================================
// src/components/TableOfContents.jsx — "On this page" box
//
// Lists the post's headings as jump links. Collapsible so it
// doesn't push the article down too much on small screens.
// Only shown when a post has 2+ headings.
// ============================================================

const TableOfContents = ({ headings }) => {
    if (headings.length < 2) return null;

    // Indent relative to the biggest heading level actually used
    const topLevel = Math.min(...headings.map((h) => h.level));

    return (
        <details
            open
            style={{
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-card)",
                padding: "0.75rem 1rem",
                marginBottom: "2rem",
            }}
        >
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>📑 On this page</summary>
            <nav aria-label="Table of contents">
                <ul style={{ listStyle: "none", margin: "0.75rem 0 0", padding: 0 }}>
                    {headings.map((h) => (
                        <li key={h.id} style={{ paddingLeft: `${h.level - topLevel}rem`, margin: "0.35rem 0" }}>
                            <a href={`#${h.id}`} style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                                {h.text}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </details>
    );
};

export default TableOfContents;
