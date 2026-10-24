// ============================================================
// src/components/AiSuggestions.jsx — "✨ AI suggestions" in the editor
//
// Asks Claude (through our backend) for an excerpt, tags and
// alternative titles. Nothing changes until the author clicks "Use".
// Renders nothing if the server hasn't enabled the AI assistant.
// ============================================================

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getAiStatus, getAiSuggestions } from "../api/ai";

const AiSuggestions = ({ getDraft, onUseExcerpt, onAddTags, onUseTitle }) => {
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState(null);

    useEffect(() => {
        getAiStatus()
            .then((data) => setEnabled(data.enabled))
            .catch(() => {}); // Stay hidden
    }, []);

    if (!enabled) return null;

    const handleSuggest = async () => {
        setLoading(true);
        try {
            const data = await getAiSuggestions(getDraft());
            setSuggestions(data);
        } catch (error) {
            toast.error(error.response?.data?.message || "Couldn't get suggestions");
        } finally {
            setLoading(false);
        }
    };

    const chip = {
        fontSize: "0.8rem",
        padding: "0.2rem 0.6rem",
        borderRadius: "var(--radius-full)",
        border: "1px solid var(--border-color)",
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
    };

    return (
        <div className="form-group" style={{ border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <div>
                    <div style={{ fontWeight: 600 }}>✨ AI suggestions</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Get an excerpt, tags and title ideas from your draft. Nothing changes until you click "Use".
                    </div>
                </div>
                <button type="button" onClick={handleSuggest} className="btn btn-ghost btn-sm" disabled={loading}>
                    {loading ? "Thinking..." : suggestions ? "↻ Try again" : "✨ Suggest"}
                </button>
            </div>

            {suggestions && (
                <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {suggestions.excerpt && (
                        <div>
                            <div className="form-label">Excerpt</div>
                            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>{suggestions.excerpt}</p>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onUseExcerpt(suggestions.excerpt)}>Use excerpt</button>
                        </div>
                    )}

                    {suggestions.tags.length > 0 && (
                        <div>
                            <div className="form-label">Tags</div>
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
                                {suggestions.tags.map((tag) => (
                                    <button type="button" key={tag} style={{ ...chip, cursor: "pointer" }} onClick={() => onAddTags([tag])} title="Add this tag">
                                        + {tag}
                                    </button>
                                ))}
                            </div>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onAddTags(suggestions.tags)}>Add all tags</button>
                        </div>
                    )}

                    {suggestions.titles.length > 0 && (
                        <div>
                            <div className="form-label">Title ideas</div>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                {suggestions.titles.map((t) => (
                                    <li key={t} style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                                        <span style={{ fontSize: "0.9rem" }}>{t}</span>
                                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onUseTitle(t)}>Use</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AiSuggestions;
