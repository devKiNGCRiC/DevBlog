// ============================================================
// src/components/LoadingSpinner.jsx — Loading Indicator
//
// A simple spinning circle shown while data is being fetched.
// "fullPage" prop = make it cover the whole screen (for page loads)
// ============================================================

const LoadingSpinner = ({ fullPage = false, size = "md" }) => {
    // Size classes for different spinner sizes
    const sizeMap = { sm: 24, md: 40, lg: 60 };
    const spinnerSize = sizeMap[size] || 40;

    if (fullPage) {
        // Full page centered spinner (used while the whole page loads)
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh", // At least 60% of screen height
                    flexDirection: "column",
                    gap: "1rem",
                }}
            >
                <div
                    className="spinner"
                    style={{ width: spinnerSize, height: spinnerSize }}
                />
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                    Loading...
                </p>
            </div>
        );
    }

    // Inline spinner (used inside buttons, smaller sections)
    return (
        <div
            className="spinner"
            style={{ width: spinnerSize, height: spinnerSize }}
        />
    );
};

export default LoadingSpinner;
