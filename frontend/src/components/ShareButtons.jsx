// ============================================================
// src/components/ShareButtons.jsx — Share a post
//
// On phones that support it, "Share" opens the device's native
// share sheet. Everywhere else we show plain links to X, LinkedIn
// and Reddit, plus a "Copy link" button.
// ============================================================

import toast from "react-hot-toast";

const ShareButtons = ({ title, url }) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const links = [
        { label: "X", href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
        { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
        { label: "Reddit", href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}` },
    ];

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied!");
        } catch {
            toast.error("Couldn't copy the link");
        }
    };

    const nativeShare = async () => {
        try {
            await navigator.share({ title, url });
        } catch {
            // User closed the share sheet — nothing to do
        }
    };

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Share:</span>
            {typeof navigator.share === "function" && (
                <button onClick={nativeShare} className="btn btn-ghost btn-sm">📤 Share</button>
            )}
            {links.map((link) => (
                <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                >
                    {link.label}
                </a>
            ))}
            <button onClick={copyLink} className="btn btn-ghost btn-sm">🔗 Copy link</button>
        </div>
    );
};

export default ShareButtons;
