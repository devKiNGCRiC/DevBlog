// ============================================================
// server.js — Main Entry Point of the Backend
//
// This is the FIRST file that runs when you start the backend.
// Think of it like the "main door" of our application.
// It sets up Express, connects to the database,
// and starts listening for incoming requests.
//
// HOW TO REMEMBER: Server.js = the starting point
// ============================================================

// Load environment variables from the .env file
// This must be done FIRST before anything else, because other files
// might need the env variables immediately when they're imported.
require("dotenv").config();

const express = require("express"); // The web framework
const cors = require("cors"); // Allows frontend (different port) to talk to backend
const morgan = require("morgan"); // Logs HTTP requests in the terminal (great for debugging!)
const rateLimit = require("express-rate-limit"); // Prevents too many requests (spam protection)
const helmet = require("helmet"); // Sets various HTTP security headers automatically

const connectDB = require("./config/db"); // Our database connection function

// Import route files (each handles a different part of the API)
const authRoutes = require("./routes/auth.routes");
const postRoutes = require("./routes/post.routes");
const commentRoutes = require("./routes/comment.routes");           // Nested under /api/posts
const commentStandaloneRoutes = require("./routes/comment-standalone.routes"); // Standalone /api/comments
const userRoutes = require("./routes/user.routes");

// Import custom error-handling middleware
const { notFound, errorHandler } = require("./middleware/error.middleware");

// ============================================================
// Connect to MongoDB Database
// This is async — it takes time, but we call it early
// ============================================================
connectDB();

// ============================================================
// Create the Express Application
// "app" is our Express web server object
// ============================================================
const app = express();

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
if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev")); // Only log in development (not in production)
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

// ============================================================
// ERROR HANDLING MIDDLEWARE
// These must come AFTER all routes.
// If no route handled the request → notFound runs.
// If any error was thrown → errorHandler runs.
// ============================================================
app.use(notFound); // 404 handler for unknown routes
app.use(errorHandler); // Global error handler

// ============================================================
// START THE SERVER
// "listen" = start listening for incoming requests
// ============================================================
const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

app.listen(PORT, () => {
    console.log(`
  ======================================
  🚀 DevBlog Server is Running!
  ======================================
  📡 Port     : ${PORT}
  🌍 Mode     : ${process.env.NODE_ENV || "development"}
  🔗 API URL  : http://localhost:${PORT}/api
  ❤️  Health   : http://localhost:${PORT}/api/health
  ======================================
  `);
});

// Handle unhandled promise rejections (safety net for async errors)
// Example: if MongoDB connection fails after startup
process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Rejection:", err.message);
    process.exit(1); // Crash the process — the server shouldn't run with a broken DB
});
