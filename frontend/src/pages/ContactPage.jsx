// ============================================================
// src/pages/ContactPage.jsx — Contact Us Page
// ============================================================

import { useState, useRef } from "react";
import emailjs from "@emailjs/browser";
import toast from "react-hot-toast";

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const ContactPage = () => {
    const formRef = useRef(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.message) {
            toast.error("Please fill in all required fields.");
            return;
        }

        if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
            toast.error("EmailJS is not configured. Please add your credentials to .env");
            return;
        }

        setSubmitting(true);
        try {
            await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, {
                publicKey: PUBLIC_KEY,
            });
            toast.success("Message sent! We'll get back to you soon 🎉");
            setFormData({ name: "", email: "", subject: "", message: "" });
        } catch (err) {
            console.error("EmailJS error:", err);
            toast.error("Failed to send message. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-wrapper container" style={{ paddingTop: "calc(var(--navbar-height) + 2rem)", paddingBottom: "2rem", maxWidth: "600px" }}>
            <div className="card" style={{ padding: "clamp(1.25rem, 5vw, 3rem)", animation: "fadeIn 0.5s ease" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <span style={{ fontSize: "3rem", marginBottom: "1rem", display: "block" }}>📬</span>
                    <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                        Get in Touch
                    </h1>
                    <p style={{ color: "var(--text-secondary)" }}>
                        Have a question, feedback, or just want to say hi? Send us a message!
                    </p>
                </div>

                <form ref={formRef} onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Your Name *</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address *</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Subject</label>
                        <input
                            type="text"
                            name="subject"
                            className="form-input"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="What is this regarding?"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Message *</label>
                        <textarea
                            name="message"
                            className="form-input"
                            rows="5"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Type your message here..."
                            style={{ resize: "vertical" }}
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full btn-lg"
                        style={{ marginTop: "1rem" }}
                        disabled={submitting}
                    >
                        {submitting ? "Sending..." : "Send Message 📬"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ContactPage;
