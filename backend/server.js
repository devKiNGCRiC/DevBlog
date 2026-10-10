// ============================================================
// server.js — Main Entry Point of the Backend
//
// This is the FIRST file that runs when you start the backend.
// Think of it like the "main door" of our application.
// It loads env variables, connects to the database, and starts
// listening for requests. The app itself is built in app.js.
//
// HOW TO REMEMBER: Server.js = the starting point
// ============================================================

// Load environment variables from the .env file
// This must be done FIRST before anything else, because other files
// might need the env variables immediately when they're imported.
require("dotenv").config();

const connectDB = require("./config/db"); // Our database connection function
const app = require("./app"); // The Express app (middleware + routes)

// ============================================================
// Connect to MongoDB Database
// This is async — it takes time, but we call it early
// ============================================================
connectDB();


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
