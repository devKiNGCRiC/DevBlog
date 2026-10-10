// ============================================================
// scripts/set-password.js — Set a user's password directly (dev tool)
//
// For when you're locked out locally and email isn't configured.
// Saves through the User model, so the pre-save hook hashes the
// password exactly like a normal signup or reset would.
//
// USAGE (from the backend folder):
//   node scripts/set-password.js <email> <newPassword>
// ============================================================

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const User = require("../models/User.model");

const [email, newPassword] = process.argv.slice(2);

const run = async () => {
    if (!email || !newPassword) {
        console.error("Usage: node scripts/set-password.js <email> <newPassword>");
        process.exit(1);
    }
    if (newPassword.length < 8) {
        console.error("Password must be at least 8 characters.");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    // Emails are stored lowercase (see User.model.js)
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
        console.error(`No user found with email: ${email}`);
        const users = await User.find().select("email username").limit(20);
        console.error("Existing accounts:", users.map((u) => `${u.email} (${u.username})`).join(", ") || "none");
        await mongoose.disconnect();
        process.exit(1);
    }

    user.password = newPassword; // Hashed by the pre-save hook
    user.resetPasswordToken = undefined; // Invalidate any pending reset link
    user.resetPasswordExpiry = undefined;
    await user.save();

    console.log(`✅ Password updated for ${user.email} (${user.username}, role: ${user.role})`);
    await mongoose.disconnect();
};

run().catch(async (err) => {
    console.error("❌ Failed:", err.message);
    await mongoose.disconnect();
    process.exit(1);
});
