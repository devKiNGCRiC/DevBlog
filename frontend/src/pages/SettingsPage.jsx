// ============================================================
// src/pages/SettingsPage.jsx — User Settings (Change Password)
// ============================================================

import { useState } from "react";
import toast from "react-hot-toast";
import { changePassword } from "../api/auth";

const SettingsPage = () => {
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            toast.error("Please fill in all fields.");
            return;
        }

        if (formData.newPassword.length < 8) {
            toast.error("New password must be at least 8 characters.");
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }

        setIsSubmitting(true);

        try {
            await changePassword({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });
            toast.success("Password changed successfully! 🔒");
            setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to change password");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-wrapper container" style={{ paddingTop: "calc(var(--navbar-height) + 2rem)", paddingBottom: "2rem", maxWidth: "600px" }}>
            <div className="card" style={{ padding: "clamp(1.25rem, 4vw, 2.5rem)", animation: "fadeIn 0.5s ease" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <span style={{ fontSize: "3rem", marginBottom: "1rem", display: "block" }}>⚙️</span>
                    <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                        Account Settings
                    </h1>
                    <p style={{ color: "var(--text-secondary)" }}>
                        Update your security preferences and password.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Toggle password visibility — placed at top of form for all fields */}
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.25rem" }}>
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-primary)", fontSize: "0.875rem", fontWeight: 500, padding: "0.25rem 0" }}
                        >
                            {showPassword ? "🙈 Hide Passwords" : "👁️ Show Passwords"}
                        </button>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="currentPassword"
                                className="form-input"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                placeholder="Enter current password"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="newPassword"
                                className="form-input"
                                value={formData.newPassword}
                                onChange={handleChange}
                                placeholder="At least 8 characters"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                className="form-input"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Repeat new password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full btn-lg"
                        disabled={isSubmitting}
                        style={{ marginTop: "1rem" }}
                    >
                        {isSubmitting ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SettingsPage;
