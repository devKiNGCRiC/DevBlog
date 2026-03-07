// ============================================================
// middleware/error.middleware.js — Global Error Handler
//
// When any controller throws an error, Express passes it here.
// Instead of crashing the server, we catch it and send a
// clean JSON error response to the client.
//
// Think of this like a net at the bottom of a trapeze —
// if something goes wrong, the net (this middleware) catches it
// and handles it gracefully.
// ============================================================

// "notFound" middleware — runs when no route matched the request URL
// Like going to a restaurant and asking for a dish that's not on the menu
const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    res.status(404); // 404 = "Not Found"
    next(error); // Pass this error to the error handler below
};

// "errorHandler" middleware — the final error catcher
// It must have exactly 4 parameters: (err, req, res, next)
// Express knows it's an error handler if it has 4 params!
const errorHandler = (err, req, res, next) => {
    // Sometimes a successful status code was set but an error occurred
    // In that case, change it to 500 (Internal Server Error)
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // --- Handle specific MongoDB/Mongoose error types ---

    // CastError: happens when you pass an invalid MongoDB ID
    // Example: /api/posts/INVALID_ID → Mongoose tries to cast "INVALID_ID" to ObjectId and fails
    if (err.name === "CastError" && err.kind === "ObjectId") {
        statusCode = 404;
        message = "Resource not found (invalid ID format)";
    }

    // ValidationError: happens when data doesn't match the schema rules
    // Example: trying to save a post without a title
    if (err.name === "ValidationError") {
        statusCode = 400; // 400 = Bad Request (client sent wrong data)
        // Extract all validation error messages and join them
        message = Object.values(err.errors)
            .map((val) => val.message)
            .join(", ");
    }

    // Duplicate key error (code 11000): happens when unique field is duplicated
    // Example: two users trying to use the same email
    if (err.code === 11000) {
        statusCode = 400;
        // Extract the field name that caused the duplicate error
        const field = Object.keys(err.keyValue)[0];
        message = `${field} already exists. Please use a different ${field}.`;
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token. Please login again.";
    }

    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expired. Please login again.";
    }

    // Send the error response as JSON
    res.status(statusCode).json({
        success: false,
        message: message,
        // In development mode, also send the stack trace (helps with debugging)
        // In production mode, hide the stack trace from users
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
};

module.exports = { notFound, errorHandler };
