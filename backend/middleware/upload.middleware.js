// ============================================================
// middleware/upload.middleware.js — File Upload Handler
//
// When users upload a cover image or profile picture,
// this middleware handles accepting the file and sending it to Cloudinary.
// "multer" is the package that processes file uploads in Express.
// Without this, Express doesn't know how to handle image files!
// ============================================================

const multer = require("multer"); // Library to handle file uploads

// Use memory storage — files are kept as Buffer in req.file.buffer
// and uploaded to Cloudinary manually inside the controllers.
// This avoids multer-storage-cloudinary compatibility issues.
const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024, // Max file size: 5MB (5 × 1024 × 1024 bytes)
    },

    // File filter: only allow image files
    fileFilter: (req, file, cb) => {
        // "mimetype" tells us what kind of file it is
        // image/jpeg, image/png, image/gif, image/webp are all valid image types
        if (file.mimetype.startsWith("image/")) {
            cb(null, true); // null = no error, true = accept the file
        } else {
            // Reject the file with an error message
            cb(new Error("Only image files are allowed!"), false);
        }
    },
});

module.exports = upload;
