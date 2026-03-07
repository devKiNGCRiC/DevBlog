// ============================================================
// config/db.js — Database Connection File
//
// This file handles connecting our Express server to MongoDB Atlas.
// Think of this like: our app is a phone, MongoDB is the internet —
// this file dials the number and establishes the connection.
// ============================================================

// "mongoose" is a library that helps us talk to MongoDB easily.
// Without it, we'd have to write complex raw database commands.
const mongoose = require("mongoose");

// We define an "async" function — "async" means this function
// does something that takes time (like connecting to internet),
// so we have to "await" for it to finish before moving on.
const connectDB = async () => {
  try {
    // "process.env.MONGO_URI" reads the value from our .env file.
    // We NEVER hardcode (write directly) the password in the code —
    // that would be like writing your PIN on the ATM machine!
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // If connection is successful, print a nice message to the console.
    // conn.connection.host gives us the server address we connected to.
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If something went wrong (wrong password, no internet), catch the error.
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    // "process.exit(1)" means: stop the whole program with an error code.
    // We do this because if the database is not connected, the app is useless.
    process.exit(1);
  }
};

// Export this function so other files (like server.js) can import and use it.
module.exports = connectDB;
