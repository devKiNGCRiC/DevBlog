// ============================================================
// src/components/ReportButton.jsx — "🚩 Report" + its dialog
//
// Lets a reader flag a post or comment for moderators.
// Pass "buttonStyle"/"className" so it matches where it's placed.
// ============================================================

import { useState } from "react";
import toast from "react-hot-toast";
import { createReport, REPORT_REASONS } from "../api/reports";

const ReportButton = ({ targetType, targetId, className, buttonStyle }) => {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const close = () => {
        setOpen(false);
        setReason("");
        setDetails("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) {
            toast.error("Please choose a reason");
            return;
        }
        setSubmitting(true);
        try {
            const data = await createReport({ targetType, targetId, reason, details: details.trim() });
            toast.success(data.message || "Report sent");
            close();
        } catch (error) {
            toast.error(error.response?.data?.message || "Couldn't send the report");
        } finally {
            setSubmitting(false);
        }
    };

    const titleId = `report-title-${targetId}`;

    return (
        <>
            <button onClick={() => setOpen(true)} className={className} style={buttonStyle}>
                🚩 Report
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    onClick={close} // Close on backdrop click
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0, 0, 0, 0.55)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "1rem",
                        backdropFilter: "blur(3px)",
                    }}
                >
                    <form
                        className="card"
                        onSubmit={handleSubmit}
                        onClick={(e) => e.stopPropagation()}
                        style={{ padding: "clamp(1.25rem, 5vw, 2rem)", maxWidth: 440, width: "100%", animation: "fadeIn 0.15s ease" }}
                    >
                        <h3 id={titleId} style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                            🚩 Report this {targetType}
                        </h3>
                        <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem", fontSize: "0.9rem" }}>
                            A moderator will review it. The author won't see who reported it.
                        </p>

                        <fieldset style={{ border: "none", padding: 0, margin: "0 0 1rem" }}>
                            <legend className="form-label">Why are you reporting it?</legend>
                            {REPORT_REASONS.map((r) => (
                                <label key={r.value} style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.3rem 0", cursor: "pointer" }}>
                                    <input
                                        type="radio"
                                        name={`reason-${targetId}`}
                                        value={r.value}
                                        checked={reason === r.value}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                    {r.label}
                                </label>
                            ))}
                        </fieldset>

                        <label className="form-label" htmlFor={`details-${targetId}`}>Anything else? (optional)</label>
                        <textarea
                            id={`details-${targetId}`}
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="form-input form-textarea"
                            style={{ minHeight: 70, marginBottom: "1.25rem" }}
                            maxLength={500}
                        />

                        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                            <button type="button" onClick={close} className="btn btn-ghost">Cancel</button>
                            <button type="submit" className="btn btn-danger" disabled={submitting}>
                                {submitting ? "Sending..." : "Send report"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};

export default ReportButton;
