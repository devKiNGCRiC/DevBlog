// ============================================================
// src/components/ReadingProgress.jsx — Thin bar under the navbar
//
// Fills from 0% to 100% as the reader scrolls through the
// element passed in "targetRef" (the post body).
// ============================================================

import { useEffect, useState } from "react";

const ReadingProgress = ({ targetRef }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const update = () => {
            const el = targetRef.current;
            if (!el) return;
            const { top, height } = el.getBoundingClientRect();
            // How far the article has scrolled past the top, out of how far it CAN scroll
            const scrollable = height - window.innerHeight;
            const ratio = scrollable > 0 ? -top / scrollable : top < 0 ? 1 : 0;
            setProgress(Math.min(1, Math.max(0, ratio)));
        };
        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
        };
    }, [targetRef]);

    return (
        <div
            role="progressbar"
            aria-label="Reading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            style={{
                position: "fixed",
                top: "var(--navbar-height)",
                left: 0,
                height: 3,
                width: `${progress * 100}%`,
                background: "var(--accent-gradient)",
                zIndex: 1001, // Just above the navbar
                transition: "width 0.1s linear",
            }}
        />
    );
};

export default ReadingProgress;
