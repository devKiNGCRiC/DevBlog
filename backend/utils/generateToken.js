// ============================================================
// utils/generateToken.js — JWT Token Generator
//
// JWT = JSON Web Token. Think of it like a hotel room key card.
// When you log in, we give you this "key card" (token).
// Every time you do something that needs login (create post, like, etc.)
// you show this key card to prove who you are.
// The key card expires after some days — you must login again to get a new one.
// ============================================================

const jwt = require("jsonwebtoken"); // Library to create/verify JWT tokens

// Validate at startup — crash early if the secret is missing instead of at runtime
if (!process.env.JWT_SECRET) {
    throw new Error("FATAL: JWT_SECRET environment variable is not defined.");
}

// This function creates a JWT token for a user
// "userId" is the unique ID from MongoDB for that user
const generateToken = (userId) => {
    // jwt.sign() creates the token:
    // - First arg: the DATA we want to store inside the token (just the user ID)
    // - Second arg: the SECRET key used to sign/lock the token (from .env)
    // - Third arg: options — here we set when the token expires
    return jwt.sign(
        { id: userId }, // Payload (data inside the token)
        process.env.JWT_SECRET, // Secret key — only our server knows this
        { expiresIn: process.env.JWT_EXPIRE || "7d" } // Token lasts 7 days
    );
};

module.exports = generateToken;
