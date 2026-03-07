// ============================================================
// config/cloudinary.js — Cloudinary Configuration
//
// Cloudinary is a cloud service that stores images for us.
// Instead of storing images on our own server (which takes space),
// we upload them to Cloudinary — it gives us back a URL to use.
// Think of it like Google Photos, but for developer apps!
// ============================================================

// Import the cloudinary library (v2)
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with our account credentials from .env file
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Export cloudinary instance (used in controllers for upload + deletion)
module.exports = { cloudinary };
