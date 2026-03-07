// ============================================================
// middleware/auth.middleware.js — Authentication Guard
//
// "Middleware" is code that runs BETWEEN receiving a request
// and sending a response. Like a security checkpoint.
//
// This middleware is like a guard at a nightclub entrance:
// - It checks your "token" (ID card)
// - If valid → you're allowed in (req.user is set with your info)
// - If invalid or missing → you're rejected with a 401 error
//
// We attach this middleware to routes that need login protection.
// ============================================================

const jwt = require("jsonwebtoken"); // For verifying tokens
const User = require("../models/User.model"); // To fetch user from database

// "protect" middleware — call this on any route that needs authentication
const protect = async (req, res, next) => {
    let token;

    // Check if the request has an Authorization header like:
    // "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            // Extract just the token part (remove the word "Bearer " from the start)
            // "Bearer abc123" → "abc123"
            token = req.headers.authorization.split(" ")[1];

            // Verify the token using our secret key
            // If the token was tampered with or expired, this will throw an error
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the user from the database using the ID stored in the token
            // "-password" means: get all fields EXCEPT the password (security!)
            req.user = await User.findById(decoded.id).select("-password");

            // If user doesn't exist (maybe deleted their account)
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found. Please login again.",
                });
            }

            // Token is valid! Call next() to move to the actual route handler
            next();
        } catch (error) {
            // Token was invalid or expired
            return res.status(401).json({
                success: false,
                message: "Not authorized. Token is invalid or expired.",
            });
        }
    } else {
        // No Authorization header at all
        return res.status(401).json({
            success: false,
            message: "Not authorized. No token provided.",
        });
    }
};

// "adminOnly" middleware — only allows admin users
// Use this AFTER "protect" middleware (protect must run first to set req.user)
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next(); // User is admin, let them through
    } else {
        res.status(403).json({
            // 403 = Forbidden (you're logged in but not allowed to do this)
            success: false,
            message: "Access denied. Admins only.",
        });
    }
};

module.exports = { protect, adminOnly };
