// ============================================================
// src/pages/ProfilePage.jsx — User Public Profile
//
// Shows bio, follower/following counts, and user's posts.
// Also allows logged-in users to follow/unfollow.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { getUserProfile, followUser } from "../api/users";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import useAuthStore from "../store/authStore";
import { formatDate } from "../utils/helpers";
import toast from "react-hot-toast";

const ProfilePage = () => {
    const { username } = useParams(); // Get username from URL: /profile/:username
    const { user: currentUser } = useAuthStore();
    const isLoggedIn = !!currentUser;

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [pagination, setPagination] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    // Tracks when a page reset is caused by username changing, so the
    // currentPage effect doesn't fire a duplicate fetch.
    const isUsernameChangingRef = useRef(false);

    useEffect(() => {
        isUsernameChangingRef.current = true;
        setCurrentPage(1); // Reset page when switching profiles
        fetchProfile(1);
    }, [username]); // Re-fetch when username in URL changes

    useEffect(() => {
        if (isUsernameChangingRef.current) {
            // This currentPage change was triggered by a username change;
            // the username effect already fetched page 1 — skip this run.
            isUsernameChangingRef.current = false;
            return;
        }
        if (profile) fetchProfile(currentPage);
    }, [currentPage]);

    const fetchProfile = async (page = 1) => {
        setLoading(true);
        try {
            const data = await getUserProfile(username, { page, limit: 9 });
            setProfile(data.user);
            setPosts(data.posts);
            setFollowerCount(data.followerCount);
            setPagination(data.pagination || {});

            // Check if current user follows this profile
            // Use String() to normalise ObjectId vs string comparison
            if (currentUser) {
                setIsFollowing(
                    data.user.followers?.some((f) => String(f._id) === String(currentUser._id))
                );
            }
        } catch {
            toast.error("Profile not found");
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!isLoggedIn) {
            toast("Please login to follow users", { icon: "🔐" });
            return;
        }
        try {
            const data = await followUser(profile._id);
            setIsFollowing(data.following);
            setFollowerCount((prev) => (data.following ? prev + 1 : prev - 1));
            toast.success(data.following ? "Following! 🎉" : "Unfollowed");
        } catch {
            toast.error("Failed to update follow status");
        }
    };

    if (loading) return <LoadingSpinner fullPage />;
    if (!profile) return null;

    const isOwnProfile = currentUser?.username === username;

    return (
        <div className="page-wrapper" style={{ paddingBottom: "4rem" }}>
            <Helmet>
                <title>{profile.name} (@{profile.username}) | DevBlog</title>
                {profile.bio && <meta name="description" content={profile.bio} />}
            </Helmet>
            {/* ---- PROFILE HEADER (Cover + Avatar) ---- */}
            <div
                style={{
                    height: "280px",
                    background: "var(--accent-gradient)",
                    position: "relative",
                    borderBottom: "1px solid var(--border-light)"
                }}
            >
                {profile.coverImage && (
                    <img
                        src={profile.coverImage}
                        alt="Cover"
                        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }}
                    />
                )}
            </div>

            <div className="container" style={{ maxWidth: "900px" }}>
                <div
                    className="card"
                    style={{
                        marginTop: "-80px", // Pull up over the cover
                        position: "relative",
                        padding: "2rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.5rem",
                        boxShadow: "var(--shadow-lg)"
                    }}
                >
                    {/* Top Row: Avatar + Actions */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                        {/* Avatar */}
                        {profile.profilePicture ? (
                            <img
                                src={profile.profilePicture}
                                alt={profile.name}
                                style={{
                                    width: 140, height: 140, borderRadius: "50%",
                                    objectFit: "cover",
                                    border: "6px solid var(--bg-card)",
                                    boxShadow: "var(--shadow-md)",
                                    marginTop: "-60px" // Pull avatar up even more slightly
                                }}
                            />
                        ) : (
                            <div style={{
                                width: 140, height: 140, borderRadius: "50%",
                                background: "var(--accent-gradient)", color: "white",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "3rem", fontWeight: 800,
                                border: "6px solid var(--bg-card)",
                                boxShadow: "var(--shadow-md)",
                                marginTop: "-60px"
                            }}>
                                {profile.name?.[0]?.toUpperCase()}
                            </div>
                        )}

                        {/* Follow / Edit Profile button */}
                        <div style={{ display: "flex", gap: "1rem" }}>
                            {isOwnProfile ? (
                                <Link to="/edit-profile" className="btn btn-outline" style={{ borderRadius: "2rem", padding: "0.5rem 1.5rem" }}>
                                    ✏️ Edit Profile
                                </Link>
                            ) : (
                                <button
                                    onClick={handleFollow}
                                    className={`btn ${isFollowing ? "btn-outline" : "btn-primary"}`}
                                    style={{ borderRadius: "2rem", padding: "0.5rem 1.5rem" }}
                                >
                                    {isFollowing ? "Following" : "+ Follow"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Middle Row: NAME, BIO */}
                    <div>
                        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.25rem", color: "var(--text-primary)" }}>
                            {profile.name}
                        </h1>
                        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", marginBottom: "1rem", fontWeight: 500 }}>
                            @{profile.username}
                        </p>

                        {profile.bio && (
                            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: "700px", marginBottom: "1.5rem" }}>
                                {profile.bio}
                            </p>
                        )}

                        {/* Extra info: location, website, joined date */}
                        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                            {profile.location && (
                                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>📍 {profile.location}</span>
                            )}
                            {profile.website && (
                                <a href={profile.website} target="_blank" rel="noreferrer" style={{ color: "var(--accent-primary)", display: "flex", alignItems: "center", gap: "0.4rem", textDecoration: "none", fontWeight: 600 }}>
                                    🔗 {profile.website.replace(/^https?:\/\//, '')}
                                </a>
                            )}
                            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>📅 Joined {formatDate(profile.createdAt)}</span>
                        </div>
                    </div>

                    {/* Bottom Row: Stats */}
                    <div style={{ display: "flex", gap: "clamp(1.25rem, 5vw, 3rem)", flexWrap: "wrap", paddingTop: "1.5rem", borderTop: "1px solid var(--border-light)" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 800, fontSize: "1.5rem", color: "var(--text-primary)" }}>{followerCount}</span>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Followers</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 800, fontSize: "1.5rem", color: "var(--text-primary)" }}>{profile.following?.length || 0}</span>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Following</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 800, fontSize: "1.5rem", color: "var(--text-primary)" }}>{pagination.totalPosts ?? posts.length}</span>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Posts</span>
                        </div>
                    </div>
                </div>

                {/* ---- USER'S POSTS ---- */}
                <div style={{ marginTop: "3rem" }}>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        📝 Published Stories
                    </h2>

                    {posts.length === 0 ? (
                        <div className="card" style={{ padding: "4rem 2rem", textAlign: "center", background: "transparent", border: "2px dashed var(--border-light)", boxShadow: "none" }}>
                            <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem", opacity: 0.5 }}>📭</span>
                            <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>No stories yet</h3>
                            <p style={{ color: "var(--text-muted)" }}>
                                {isOwnProfile ? "You haven't published anything yet. Time to share your knowledge!" : `${profile.name} hasn't published any stories.`}
                            </p>
                            {isOwnProfile && (
                                <Link to="/write" className="btn btn-primary" style={{ marginTop: "1.5rem" }}>
                                    Write a Story
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2rem" }}>
                                {posts.map((post) => (
                                    <PostCard key={post._id} post={post} />
                                ))}
                            </div>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={pagination.totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
