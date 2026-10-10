// ============================================================
// tests/setupEnv.js — Environment for the test run
//
// Jest runs this BEFORE any test file is loaded, so these values
// are in place when app.js and generateToken.js read them.
// No real .env, database, Cloudinary or email account is needed.
// ============================================================

process.env.NODE_ENV = "test"; // Also turns off the rate limiters in app.js
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_EXPIRE = "1h";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.CLOUDINARY_CLOUD_NAME = "test";
process.env.CLOUDINARY_API_KEY = "test";
process.env.CLOUDINARY_API_SECRET = "test";
