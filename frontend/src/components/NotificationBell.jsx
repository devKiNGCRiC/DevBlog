// ============================================================
// src/components/NotificationBell.jsx — 🔔 with an unread badge
//
// Asks the server for the unread count when the page changes and
// once a minute in the background (simple polling — no websockets).
// ============================================================

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getUnreadCount } from "../api/notifications";

const POLL_INTERVAL_MS = 60 * 1000; // 1 minute

const NotificationBell = () => {
    const [unread, setUnread] = useState(0);
    const location = useLocation();

    useEffect(() => {
        let cancelled = false;
        const refresh = () => {
            // Don't poll from a background tab
            if (document.hidden) return;
            getUnreadCount()
                .then((data) => { if (!cancelled) setUnread(data.unreadCount); })
                .catch(() => {}); // A missed poll isn't worth bothering the user about
        };
        refresh();
        const timer = setInterval(refresh, POLL_INTERVAL_MS);
        return () => { cancelled = true; clearInterval(timer); };
    }, [location.pathname]); // Re-check after navigating (e.g. leaving the notifications page)

    const label = unread > 0 ? `Notifications (${unread} unread)` : "Notifications";

    return (
        <Link
            to="/notifications"
            className="theme-toggle"
            title={label}
            aria-label={label}
            style={{ position: "relative", textDecoration: "none" }}
        >
            🔔
            {unread > 0 && (
                <span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        minWidth: 18,
                        height: 18,
                        padding: "0 4px",
                        borderRadius: 9,
                        background: "var(--danger)",
                        color: "white",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        lineHeight: "18px",
                        textAlign: "center",
                    }}
                >
                    {unread > 99 ? "99+" : unread}
                </span>
            )}
        </Link>
    );
};

export default NotificationBell;
