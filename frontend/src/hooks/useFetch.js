// ============================================================
// src/hooks/useFetch.js — Generic Data Fetching Hook
//
// Wraps any async API call with consistent loading/error/data state.
//
// Usage example:
//   const { data, loading, error, refetch } = useFetch(
//     () => getPostBySlug(slug),
//     [slug]
//   );
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * @param {Function} fetchFn   Async function that returns data. Recreated when deps change.
 * @param {Array}    deps      Dependency array — re-fetches whenever these values change.
 * @param {*}        initial   Optional initial value for `data` (default: null).
 */
const useFetch = (fetchFn, deps = [], initial = null) => {
    const [data, setData] = useState(initial);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Track whether the component is still mounted to prevent state updates after unmount
    const isMountedRef = useRef(true);

    // useCallback keeps fetchFn identity stable unless deps change
    const execute = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchFn();
            // Only update state if the component is still mounted
            if (isMountedRef.current) {
                setData(result);
            }
            return result;
        } catch (err) {
            if (isMountedRef.current) {
                setError(err);
            }
            throw err;
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, deps); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        isMountedRef.current = true;
        execute();
        // Cleanup: mark as unmounted so stale async callbacks don't update state
        return () => {
            isMountedRef.current = false;
        };
    }, [execute]);

    return { data, loading, error, refetch: execute };
};

export default useFetch;
