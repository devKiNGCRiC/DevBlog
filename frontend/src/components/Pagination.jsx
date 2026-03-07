// ============================================================
// src/components/Pagination.jsx — Page Navigation Buttons
//
// Shows page numbers and Previous/Next buttons.
// Calls "onPageChange(newPageNumber)" when a button is clicked.
// ============================================================

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    // Don't show pagination if there's only one page
    if (totalPages <= 1) return null;

    // Create an array of page numbers to show
    // Logic: Always show first, last, current, and 1 page before/after current
    const getPageNumbers = () => {
        const pages = [];
        const delta = 1; // How many pages to show around current page

        // Range of pages to show (around current page)
        const rangeStart = Math.max(2, currentPage - delta);
        const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

        pages.push(1); // Always show first page

        // Add "..." if there's a gap between 1 and rangeStart
        if (rangeStart > 2) pages.push("...");

        // Add the middle pages
        for (let i = rangeStart; i <= rangeEnd; i++) {
            pages.push(i);
        }

        // Add "..." if there's a gap between rangeEnd and last page
        if (rangeEnd < totalPages - 1) pages.push("...");

        if (totalPages > 1) pages.push(totalPages); // Always show last page

        return pages;
    };

    const pages = getPageNumbers();

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem",
                padding: "2rem 0",
            }}
        >
            {/* Previous button */}
            <button
                className="btn btn-ghost btn-sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1} // Disable if on first page
            >
                ← Prev
            </button>

            {/* Page number buttons */}
            {pages.map((page, index) => (
                <button
                    key={index}
                    className={`btn btn-sm ${page === currentPage ? "btn-primary" : "btn-ghost"
                        }`}
                    onClick={() => typeof page === "number" && onPageChange(page)}
                    disabled={page === "..."} // "..." is not clickable
                    style={{ minWidth: "36px" }}
                >
                    {page}
                </button>
            ))}

            {/* Next button */}
            <button
                className="btn btn-ghost btn-sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages} // Disable if on last page
            >
                Next →
            </button>
        </div>
    );
};

export default Pagination;
