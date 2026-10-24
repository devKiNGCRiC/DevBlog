// ============================================================
// app.js — The Express Application
//
// This file BUILDS the app (middleware + routes) but does not
// start it. server.js starts it. Keeping them apart lets the
// tests import the app and send requests to it without
// connecting to the real database or opening a port.
// ============================================================

const express = require("express"); // The web framework
const cors = require("cors"); // Allows frontend (different port) to talk to backend
const morgan = require("morgan"); // Logs HTTP requests in the terminal (great for debugging!)
const rateLimit = require("express-rate-limit"); // Prevents too many requests (spam protection)
const helmet = require("helmet"); // Sets various HTTP security headers automatically
// Import route files (each handles a different part of the API)
const authRoutes = require("./routes/auth.routes");
const postRoutes = require("./routes/post.routes");
const commentRoutes = require("./routes/comment.routes");           // Nested under /api/posts
const commentStandaloneRoutes = require("./routes/comment-standalone.routes"); // Standalone /api/comments
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes"); // Admin-only moderation endpoints

// Import custom error-handling middleware
const { notFound, errorHandler } = require("./middleware/error.middleware");

// ============================================================
// Create the Express Application
// "app" is our Express web server object
// ============================================================
const app = express();

// Hosting platforms (Render, Railway, Heroku...) put a proxy in front of the app.
// Trusting one proxy hop makes req.ip the visitor's real IP instead of the
// proxy's — needed for per-IP rate limiting and guest view counting.
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// ============================================================
// MIDDLEWARE SETUP
// Middleware runs on EVERY request before reaching the routes.
// Think of it like conveyor belt stations — each middleware
// does its job and passes the request along.
// ============================================================

// 0. Helmet — Sets security-related HTTP response headers automatically
// Protects against well-known web vulnerabilities (XSS, clickjacking, MIME sniffing...)
app.use(
    helmet({
        // Content Security Policy — allow inline styles/scripts needed by Quill editor
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"], // Quill requires inline scripts
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"], // Quill inline styles
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "blob:"],
                connectSrc: ["'self'"],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
            },
        },
    })
);

// 1. CORS Middleware — Allows requests from our React frontend
// Without this, browsers block requests between different ports
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173", // Only allow our frontend
        credentials: true, // Allow sending cookies
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allowed HTTP methods
    })
);

// 2. Body Parser — Parses incoming JSON from request body
// Without this, req.body would be undefined
app.use(express.json({ limit: "10mb" })); // Accept JSON up to 10MB

// 3. URL-encoded data parser (for HTML forms)
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 4. Morgan Logger — Prints each request in the terminal
// Example output: "POST /api/auth/login 200 53ms"
// "dev" mode = colored, concise output
if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
    app.use(morgan("dev")); // Only log in development (not in production or tests)
}

// 5. Rate Limiters — Prevents brute force attacks and spam
// General limiter for all API routes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
    max: 100, // Maximum 100 requests per 15 minutes per IP
    message: {
        success: false,
        message: "Too many requests from this IP. Please try again after 15 minutes.",
    },
    standardHeaders: true, // Send rate limit info in response headers
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test", // Tests fire many requests from one IP
});
app.use("/api", limiter);

// Strict limiter specifically for auth endpoints (prevents brute-force login)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Only 10 attempts per IP per 15 minutes for auth routes
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test", // Tests fire many requests from one IP
});

// ============================================================
// HEALTH CHECK ROUTE
// A simple route to check if the server is running.
// Useful for deployment platforms like Render to verify the server.
// ============================================================
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "DevBlog API is running! 🚀",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    });
});

// ============================================================
// API ROUTES
// Mount each router at a specific path prefix.
// All routes inside authRoutes will be prefixed with /api/auth
// ============================================================
app.use("/api/auth", authLimiter, authRoutes); // Auth routes — with strict rate limiter
app.use("/api/posts", postRoutes); // Blog posts (CRUD, like, bookmark)
app.use("/api/posts", commentRoutes); // Comments nested under posts (add/get)
app.use("/api/comments", commentStandaloneRoutes); // Standalone comment ops (delete/like)
app.use("/api/users", userRoutes); // User profiles and follow
app.use("/api/admin", adminRoutes); // Admin-only moderation dashboard endpoints

// ============================================================
// ERROR HANDLING MIDDLEWARE
// These must come AFTER all routes.
// If no route handled the request → notFound runs.
// If any error was thrown → errorHandler runs.
// ============================================================
app.use(notFound); // 404 handler for unknown routes
app.use(errorHandler); // Global error handler

module.exports = app;
