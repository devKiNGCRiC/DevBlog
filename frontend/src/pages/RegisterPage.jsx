// ============================================================
// src/pages/RegisterPage.jsx — User Registration Page
// ============================================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register, isLoading } = useAuthStore();

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({}); // Field-level validation errors

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear the error for this field when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    // Client-side validation before sending to API
    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.username.trim()) newErrors.username = "Username is required";
        else if (formData.username.length < 3) newErrors.username = "Username must be at least 3 characters";
        else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username))
            newErrors.username = "Only letters, numbers, _ and - allowed";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 8)
            newErrors.password = "Password must be at least 8 characters";
        if (formData.password !== formData.confirmPassword)
            newErrors.confirmPassword = "Passwords do not match";
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors); // Show all validation errors
            return;
        }

        try {
            // Don't send confirmPassword to the API
            const { confirmPassword: _confirmPassword, ...dataToSend } = formData;
            await register(dataToSend);
            toast.success("Account created! Welcome to DevBlog! 🚀");
            navigate("/"); // Redirect to home after registration
        } catch (error) {
            toast.error(error.message || "Registration failed");
        }
    };

    return (
        <div className="page-wrapper">
            <Helmet><title>Create Account | DevBlog</title></Helmet>
            <div
                className="flex-center"
                style={{ minHeight: "calc(100vh - var(--navbar-height))", padding: "2rem 1rem" }}
            >
                <div className="card" style={{ width: "100%", maxWidth: 480, padding: "clamp(1.25rem, 5vw, 2.5rem)" }}>
                    {/* Header */}
                    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                        <div
                            style={{
                                width: 56, height: 56,
                                background: "var(--accent-gradient)",
                                borderRadius: "var(--radius-lg)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "1.5rem", fontWeight: 800, color: "white",
                                margin: "0 auto 1rem",
                            }}
                        >D</div>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                            Create your account
                        </h1>
                        <p style={{ color: "var(--text-muted)" }}>
                            Join thousands of readers and writers
                        </p>
                    </div>

                    {/* Register Form */}
                    <form onSubmit={handleSubmit}>
                        {/* Full Name */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="name">Full Name</label>
                            <input
                                id="name" type="text" name="name"
                                value={formData.name} onChange={handleChange}
                                className="form-input" placeholder="John Doe"
                            />
                            {errors.name && <span className="form-error">{errors.name}</span>}
                        </div>

                        {/* Username */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="username">Username</label>
                            <div style={{ position: "relative" }}>
                                <span
                                    style={{
                                        position: "absolute", left: "0.75rem", top: "50%",
                                        transform: "translateY(-50%)", color: "var(--text-muted)",
                                        fontSize: "0.9rem"
                                    }}
                                >@</span>
                                <input
                                    id="username" type="text" name="username"
                                    value={formData.username} onChange={handleChange}
                                    className="form-input" placeholder="johndoe"
                                    style={{ paddingLeft: "1.75rem" }}
                                />
                            </div>
                            {errors.username && <span className="form-error">{errors.username}</span>}
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email Address</label>
                            <input
                                id="email" type="email" name="email"
                                value={formData.email} onChange={handleChange}
                                className="form-input" placeholder="you@example.com"
                            />
                            {errors.email && <span className="form-error">{errors.email}</span>}
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    id="password" type={showPassword ? "text" : "password"}
                                    name="password" value={formData.password} onChange={handleChange}
                                    className="form-input" placeholder="At least 8 characters"
                                />
                                <button
                                    type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: "absolute", right: "0.75rem", top: "50%",
                                        transform: "translateY(-50%)", background: "none",
                                        border: "none", cursor: "pointer", color: "var(--text-muted)"
                                    }}
                                >{showPassword ? "🙈" : "👁️"}</button>
                            </div>
                            {errors.password && <span className="form-error">{errors.password}</span>}
                        </div>

                        {/* Confirm Password */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                id="confirmPassword" type="password" name="confirmPassword"
                                value={formData.confirmPassword} onChange={handleChange}
                                className="form-input" placeholder="Repeat your password"
                            />
                            {errors.confirmPassword && (
                                <span className="form-error">{errors.confirmPassword}</span>
                            )}
                        </div>

                        <button
                            type="submit" className="btn btn-primary btn-full btn-lg"
                            disabled={isLoading} style={{ marginTop: "0.5rem" }}
                        >
                            {isLoading ? "Creating account..." : "Create Account 🚀"}
                        </button>
                    </form>

                    <p style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "1.5rem" }}>
                        Already have an account?{" "}
                        <Link to="/login" style={{ fontWeight: 600, color: "var(--accent-primary)" }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
