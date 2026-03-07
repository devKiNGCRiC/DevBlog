// ============================================================
// src/components/ConfirmModal.jsx — Reusable Confirm Dialog
//
// Replaces window.confirm() with an accessible modal overlay.
// Usage:
//   <ConfirmModal
//     isOpen={showConfirm}
//     title="Delete Post?"
//     message="This cannot be undone."
//     onConfirm={handleDelete}
//     onCancel={() => setShowConfirm(false)}
//   />
// ============================================================

const ConfirmModal = ({ isOpen, title, message, confirmLabel = "Delete", onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
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
            onClick={onCancel} // Close on backdrop click
        >
            <div
                className="card"
                style={{ padding: "clamp(1.25rem, 5vw, 2rem)", maxWidth: 420, width: "100%", textAlign: "center", animation: "fadeIn 0.15s ease" }}
                onClick={(e) => e.stopPropagation()} // Prevent backdrop click from firing
            >
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⚠️</div>
                <h3 id="confirm-title" style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>
                    {title}
                </h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "1.75rem", lineHeight: 1.5 }}>
                    {message}
                </p>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                    <button onClick={onCancel} className="btn btn-ghost">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="btn btn-danger">
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
