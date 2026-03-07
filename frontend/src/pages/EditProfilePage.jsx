// ============================================================
// src/pages/EditProfilePage.jsx — Update User Profile
// ============================================================

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { updateUserProfile } from "../api/auth";
import toast from "react-hot-toast";

const EditProfilePage = () => {
    const { user, updateUser } = useAuthStore();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: user?.name || "",
        bio: user?.bio || "",
        website: user?.website || "",
        location: user?.location || "",
    });

    const coverInputRef = useRef(null);

    const [profilePicture, setProfilePicture] = useState(null);
    const [previewImage, setPreviewImage] = useState(user?.profilePicture || null);
    const [coverImage, setCoverImage] = useState(null);
    const [coverPreview, setCoverPreview] = useState(user?.coverImage || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverImage(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicture(file);
            setPreviewImage(URL.createObjectURL(file)); // Show a local preview instantly
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("Name is required.");
            return;
        }

        setIsSubmitting(true);

        try {
            // We use FormData because we might be sending a file (image)
            const submitData = new FormData();
            submitData.append("name", formData.name);
            submitData.append("bio", formData.bio);
            submitData.append("website", formData.website);
            submitData.append("location", formData.location);

            if (profilePicture) {
                submitData.append("profilePicture", profilePicture);
            }
            if (coverImage) {
                submitData.append("coverImage", coverImage);
            }

            const response = await updateUserProfile(submitData);

            // Update the global Zustand store with the new user info
            updateUser(response.user);

            toast.success("Profile updated successfully! ✨");
            navigate(`/profile/${user.username}`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-wrapper container" style={{ padding: "3rem 1rem", maxWidth: "600px" }}>
            <div className="card" style={{ padding: "2.5rem", animation: "fadeIn 0.5s ease" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                        Edit Profile
                    </h1>
                    <p style={{ color: "var(--text-secondary)" }}>
                        Customize how you appear to the DevBlog community.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Profile Picture Upload Section */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
                        <div
                            style={{
                                width: 120, height: 120, borderRadius: "50%",
                                overflow: "hidden", marginBottom: "1rem", border: "4px solid var(--border-light)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: "var(--bg-secondary)", color: "var(--text-muted)", fontSize: "2rem"
                            }}
                        >
                            {previewImage ? (
                                <img src={previewImage} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                user?.name?.charAt(0) || "U"
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            style={{ display: "none" }}
                        />
                        <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => fileInputRef.current.click()}
                        >
                            📷 Change Avatar
                        </button>
                    </div>

                    {/* Cover Image Upload Section */}
                    <div style={{ width: "100%", marginBottom: "1.5rem" }}>
                        <label className="form-label">Cover Image</label>
                        <div
                            style={{
                                height: 150,
                                borderRadius: "var(--radius-md)",
                                overflow: "hidden",
                                border: "2px dashed var(--border-color)",
                                position: "relative",
                                background: coverPreview ? "transparent" : "var(--bg-secondary)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            onClick={() => coverInputRef.current.click()}
                        >
                            {coverPreview ? (
                                <img
                                    src={coverPreview}
                                    alt="Cover preview"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                                    <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>🖼️</div>
                                    <p style={{ fontSize: "0.85rem" }}>Click to add a cover image</p>
                                </div>
                            )}
                        </div>
                        {coverPreview && (
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ marginTop: "0.5rem" }}
                                onClick={() => { setCoverImage(null); setCoverPreview(""); }}
                            >
                                🗑️ Remove Cover
                            </button>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            ref={coverInputRef}
                            onChange={handleCoverChange}
                            style={{ display: "none" }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input
                            type="text" name="name" className="form-input"
                            value={formData.name} onChange={handleChange} required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Bio</label>
                        <textarea
                            name="bio" className="form-input" rows="3"
                            value={formData.bio} onChange={handleChange}
                            placeholder="A short bio about yourself (max 200 chars)"
                            maxLength={200}
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Location</label>
                        <input
                            type="text" name="location" className="form-input"
                            value={formData.location} onChange={handleChange}
                            placeholder="e.g. Chennai, India"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Website or Portfolio</label>
                        <input
                            type="url" name="website" className="form-input"
                            value={formData.website} onChange={handleChange}
                            placeholder="https://yourwebsite.com"
                        />
                    </div>

                    <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                        <button
                            type="button"
                            className="btn btn-outline btn-full"
                            onClick={() => navigate(`/profile/${user.username}`)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Saving..." : "Save Profile"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfilePage;
