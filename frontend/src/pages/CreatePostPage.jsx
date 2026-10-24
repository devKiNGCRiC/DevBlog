// ============================================================
// src/pages/CreatePostPage.jsx — Create & Edit Blog Post
//
// Rich text editor using Quill.js (from the "quill" package).
// Supports formatting, headings, bullet lists, code blocks, etc.
// Also handles: cover image upload, categories, tags, publish/draft.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Quill from "quill"; // The rich text editor library
import "quill/dist/quill.snow.css"; // Quill's built-in styles
import { createPost, updatePost, getPostById } from "../api/posts";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

// <input type="datetime-local"> works in LOCAL time without a timezone,
// e.g. "2026-10-25T09:30". Convert a Date into that format.
const toLocalInputValue = (date) => {
    const d = new Date(date);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const isFuture = (date) => !!date && new Date(date) > new Date();

const CreatePostPage = ({ isEditing = false }) => {
    const navigate = useNavigate();
    const { id } = useParams(); // For edit mode — the post ID

    const editorRef = useRef(null); // Ref to the div where Quill will mount
    const quillRef = useRef(null); // Ref to the Quill instance itself

    const [formData, setFormData] = useState({
        title: "",
        excerpt: "",
        categories: "",
        tags: "",
    });
    const [coverImage, setCoverImage] = useState(null); // File object for upload
    const [coverPreview, setCoverPreview] = useState(""); // URL for image preview
    const [isPublished, setIsPublished] = useState(false);
    const [scheduledAt, setScheduledAt] = useState(""); // datetime-local string, "" = publish now
    const [submitting, setSubmitting] = useState(false);

    // ============================================================
    // Initialize Quill editor + pre-fill form when editing
    // useEffect with [] runs only ONCE when component first appears
    // ============================================================
    useEffect(() => {
        if (editorRef.current && !quillRef.current) {
            // Create a new Quill instance in our ref div
            quillRef.current = new Quill(editorRef.current, {
                theme: "snow", // "snow" = clean white toolbar theme (vs "bubble")
                placeholder: "Write your story here... 📝",
                modules: {
                    // Toolbar buttons — what formatting options to show
                    toolbar: [
                        [{ header: [1, 2, 3, 4, false] }], // H1, H2, H3, H4, Normal
                        ["bold", "italic", "underline", "strike"], // Text formatting
                        [{ color: [] }, { background: [] }], // Text and background color
                        [{ list: "ordered" }, { list: "bullet" }], // Numbered and bulleted lists
                        [{ indent: "-1" }, { indent: "+1" }], // Indent/outdent
                        ["blockquote", "code-block"], // Quote and code block
                        ["link", "image"], // Insert link and image URL
                        ["clean"], // Remove all formatting
                    ],
                },
            });
        }

        // If in edit mode, fetch the post and pre-fill all fields
        if (isEditing && id) {
            loadPost();
        }
    }, []); // Empty array = run only once

    // Fetch the existing post data and populate the form (edit mode)
    const loadPost = async () => {
        try {
            const data = await getPostById(id);
            const post = data.post;
            setFormData({
                title: post.title || "",
                excerpt: post.excerpt || "",
                categories: post.categories?.join(", ") || "",
                tags: post.tags?.join(", ") || "",
            });
            setIsPublished(post.isPublished || false);
            // Only show a schedule that is still in the future
            if (isFuture(post.scheduledAt)) setScheduledAt(toLocalInputValue(post.scheduledAt));
            // Show existing cover image as preview (not a blob — no revoke needed)
            if (post.coverImage) setCoverPreview(post.coverImage);
            // Set rich text content — Quill is guaranteed to be ready here
            if (quillRef.current) {
                quillRef.current.root.innerHTML = post.content || "";
            }
        } catch {
            toast.error("Failed to load post for editing");
        }
    };

    // Revoke any blob: URL when the cover preview changes or component unmounts
    useEffect(() => {
        return () => {
            if (coverPreview && coverPreview.startsWith("blob:")) {
                URL.revokeObjectURL(coverPreview);
            }
        };
    }, [coverPreview]);

    // Handle cover image selection
    const handleCoverImage = (e) => {
        const file = e.target.files[0]; // Get the first selected file
        if (!file) return;

        // Show a preview of the image before uploading
        const previewUrl = URL.createObjectURL(file); // Creates a temporary URL for the file
        setCoverPreview(previewUrl);
        setCoverImage(file);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle form submission (create or update)
    const handleSubmit = async (publish = false) => {
        // Get the HTML content from the Quill editor
        const content = quillRef.current?.root.innerHTML || "";

        // Validate required fields
        if (!formData.title.trim()) {
            toast.error("Please add a title");
            return;
        }
        if (content === "<p><br></p>" || content.trim() === "") {
            toast.error("Please write some content");
            return;
        }

        setSubmitting(true);

        // Use FormData for multipart request (needed for file upload)
        const data = new FormData();
        data.append("title", formData.title);
        data.append("content", content); // HTML string from Quill
        data.append("excerpt", formData.excerpt);
        data.append("isPublished", publish || isPublished);
        // When publishing, either schedule it or clear any old schedule ("" = go live now)
        if (publish) {
            data.append("scheduledAt", scheduledAt ? new Date(scheduledAt).toISOString() : "");
        }

        // Convert comma-separated strings into arrays
        // "Tech, Programming, React" → ["Tech", "Programming", "React"]
        const categories = formData.categories
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean); // filter(Boolean) removes empty strings
        const tags = formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        // Append as JSON strings (FormData can't handle arrays natively)
        data.append("categories", JSON.stringify(categories));
        data.append("tags", JSON.stringify(tags));

        // If a cover image was selected, include it in the form data
        if (coverImage) {
            data.append("coverImage", coverImage);
        }

        try {
            const isScheduled = publish && !!scheduledAt;
            if (isEditing && id) {
                const result = await updatePost(id, data);
                toast.success(isScheduled ? "Schedule updated! ⏰" : "Post updated! ✅");
                // A scheduled post isn't publicly viewable yet, so go to My Posts instead
                navigate(result.post?.slug && !isFuture(result.post.scheduledAt) ? `/post/${result.post.slug}` : "/my-posts");
            } else {
                const result = await createPost(data);
                toast.success(
                    isScheduled
                        ? `Scheduled for ${new Date(scheduledAt).toLocaleString()} ⏰`
                        : publish ? "Post published! 🎉" : "Draft saved! 📝"
                );
                // Navigate to the new post's page (scheduled posts aren't public yet)
                if (publish && !isScheduled && result.post?.slug) {
                    navigate(`/post/${result.post.slug}`);
                } else {
                    navigate("/my-posts");
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save post");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: "2rem", maxWidth: 860 }}>
                {/* ---- PAGE HEADER ---- */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "2rem",
                        flexWrap: "wrap",
                        gap: "1rem",
                    }}
                >
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>
                        {isEditing ? "✏️ Edit Post" : "📝 Write a Story"}
                    </h1>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                            onClick={() => handleSubmit(false)} // Save as draft
                            className="btn btn-ghost"
                            disabled={submitting}
                        >
                            {submitting ? <LoadingSpinner size="sm" /> : "💾 Save Draft"}
                        </button>
                        <button
                            onClick={() => handleSubmit(true)} // Publish
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? <LoadingSpinner size="sm" /> : scheduledAt ? "⏰ Schedule" : "🚀 Publish"}
                        </button>
                    </div>
                </div>

                {/* ---- TITLE INPUT ---- */}
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Your compelling title here..."
                    className="form-input"
                    style={{
                        fontSize: "1.625rem",
                        fontWeight: 700,
                        padding: "0.75rem 1rem",
                        marginBottom: "1.5rem",
                        border: "none",
                        borderBottom: "2px solid var(--border-color)",
                        borderRadius: 0,
                        background: "transparent",
                    }}
                />

                {/* ---- COVER IMAGE UPLOAD ---- */}
                <div style={{ marginBottom: "1.5rem" }}>
                    <label
                        htmlFor="coverImage"
                        style={{
                            display: "block",
                            cursor: "pointer",
                            borderRadius: "var(--radius-lg)",
                            overflow: "hidden",
                            border: "2px dashed var(--border-color)",
                            textAlign: "center",
                            padding: coverPreview ? 0 : "2rem",
                            transition: "var(--transition)",
                        }}
                    >
                        {coverPreview ? (
                            <img
                                src={coverPreview}
                                alt="Cover preview"
                                style={{ width: "100%", maxHeight: 360, objectFit: "cover" }}
                            />
                        ) : (
                            <div>
                                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🖼️</div>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                    Click to add a cover image (optional)
                                </p>
                            </div>
                        )}
                    </label>
                    <input
                        type="file"
                        id="coverImage"
                        accept="image/*"
                        onChange={handleCoverImage}
                        style={{ display: "none" }} // Hidden — clicking the label triggers it
                    />
                    {coverPreview && (
                        <button
                            onClick={() => { setCoverImage(null); setCoverPreview(""); }}
                            className="btn btn-ghost btn-sm"
                            style={{ marginTop: "0.5rem" }}
                        >
                            🗑️ Remove Image
                        </button>
                    )}
                </div>

                {/* ---- RICH TEXT EDITOR ---- */}
                <div
                    style={{
                        border: "1px solid var(--border-color)",
                        borderRadius: "var(--radius-md)",
                        overflow: "hidden",
                        marginBottom: "1.5rem",
                    }}
                >
                    {/* 
            This div is where Quill mounts its editor.
            Our useEffect will find this div via editorRef and initialize Quill inside it.
          */}
                    <div ref={editorRef} style={{ minHeight: 400 }} />
                </div>

                {/* ---- METADATA FIELDS ---- */}
                <div className="card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: 600 }}>
                        Post Settings
                    </h3>

                    <div className="form-group">
                        <label className="form-label" htmlFor="scheduledAt">
                            Schedule for later (optional — leave empty to publish right away)
                        </label>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <input
                                type="datetime-local"
                                id="scheduledAt"
                                value={scheduledAt}
                                min={toLocalInputValue(new Date())}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                className="form-input"
                                style={{ maxWidth: 260 }}
                            />
                            {scheduledAt && (
                                <button type="button" onClick={() => setScheduledAt("")} className="btn btn-ghost btn-sm">
                                    ✕ Clear
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Excerpt (short description shown in feed)</label>
                        <textarea
                            name="excerpt"
                            value={formData.excerpt}
                            onChange={handleChange}
                            placeholder="Brief description of your post... (auto-generated if empty)"
                            className="form-input form-textarea"
                            style={{ minHeight: 80 }}
                            maxLength={300}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">
                                Categories (comma-separated)
                            </label>
                            <input
                                type="text"
                                name="categories"
                                value={formData.categories}
                                onChange={handleChange}
                                placeholder="Technology, Tutorial, React"
                                className="form-input"
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Tags (comma-separated)</label>
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="javascript, nodejs, beginner"
                                className="form-input"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePostPage;
