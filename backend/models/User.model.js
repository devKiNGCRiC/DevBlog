// ============================================================
// models/User.model.js — User Database Schema
//
// A "model" is like a blueprint/form for storing data.
// This tells MongoDB: "Every user must have these fields."
// Think of it like a form you fill at a hospital —
// it always asks for name, age, phone, etc.
// ============================================================

const mongoose = require("mongoose"); // Tool to define database schemas
const bcrypt = require("bcryptjs"); // Tool to hash (scramble) passwords

// Define the "shape" (structure) of a user in our database
const userSchema = new mongoose.Schema(
    {
        // --- Basic Info ---
        name: {
            type: String, // This field stores text
            required: [true, "Name is required"], // Can't create a user without name
            trim: true, // Remove spaces at start/end: "  John  " → "John"
            maxlength: [50, "Name cannot be more than 50 characters"],
        },

        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true, // No two users can have the same username
            trim: true,
            lowercase: true, // Always save as lowercase: "JohnDoe" → "johndoe"
            minlength: [3, "Username must be at least 3 characters"],
            maxlength: [30, "Username cannot be more than 30 characters"],
            // This regex (pattern) says: only letters, numbers, underscores, hyphens allowed
            match: [
                /^[a-zA-Z0-9_-]+$/,
                "Username can only contain letters, numbers, underscores and hyphens",
            ],
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true, // No two users can have same email
            lowercase: true,
            trim: true,
            // This regex checks if the email format is valid (has @ and .com etc.)
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            // "select: false" means: when we fetch a user, DON'T include the password
            // This is a security feature — password never leaks accidentally
            select: false,
        },

        // --- Profile Info ---
        profilePicture: {
            type: String, // We store the URL of the image (uploaded to Cloudinary)
            default: "", // Empty string — frontend renders an initials avatar as fallback
        },

        coverImage: {
            type: String, // Profile banner/cover photo URL
            default: "",
        },

        bio: {
            type: String, // Short description about yourself
            maxlength: [200, "Bio cannot be more than 200 characters"],
            default: "",
        },

        website: {
            type: String, // Personal website link (optional)
            default: "",
        },

        location: {
            type: String, // Where you're from (e.g., "Chennai, India")
            default: "",
        },

        // --- Social Stats ---
        // These arrays store the IDs of users who follow/are followed by this user
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId, // ObjectId is MongoDB's unique ID type
                ref: "User", // This refers to the User model (self-reference!)
            },
        ],

        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        // --- Account Settings ---
        role: {
            type: String,
            enum: ["user", "admin"], // Only these two values are allowed
            default: "user", // New users start as regular users
        },

        isVerified: {
            type: Boolean, // true/false — is their email verified?
            default: false,
        },

        // --- Email Verification ---
        // A random token sent to the user's email to verify their address
        verificationToken: {
            type: String,
            select: false, // Never expose this in API responses
        },
        verificationTokenExpiry: {
            type: Date,
            select: false, // Never expose this in API responses
        },
    },
    {
        // "timestamps: true" automatically adds:
        // - createdAt: when this document was created
        // - updatedAt: when this document was last updated
        timestamps: true,
    }
);

// ============================================================
// MIDDLEWARE (Hook): Hash the password before saving to database
//
// "pre('save')" means: "BEFORE saving a user, run this function"
// We never store plain text passwords — we hash them first.
// Hashing = turning "mypassword123" into "$2a$10$xyz..." (unreadable)
// Even we (the developers) can't see the real password after hashing!
// ============================================================
userSchema.pre("save", async function () {
    // "this" refers to the user document being saved
    // If the password was NOT changed (e.g., just updating bio), skip hashing
    if (!this.isModified("password")) {
        return; // Move to the next step without hashing
    }

    // "bcrypt.genSalt(10)" creates a random "salt" value with complexity 10
    // Salt makes hashing more secure — same password gets different hash each time
    const salt = await bcrypt.genSalt(10);

    // Replace the plain password with its hashed version
    this.password = await bcrypt.hash(this.password, salt);
});

// ============================================================
// METHOD: matchPassword
//
// This is a custom function we add to every User document.
// When someone tries to login, we compare their typed password
// to the hashed password stored in the database.
// bcrypt.compare() does this magic — it can compare even though
// the stored password is hashed!
// ============================================================
userSchema.methods.matchPassword = async function (enteredPassword) {
    // Returns true if password matches, false if it doesn't
    return await bcrypt.compare(enteredPassword, this.password);
};

// Create the "User" model from the schema and export it
// "User" becomes the collection name in MongoDB (stored as "users")
const User = mongoose.model("User", userSchema);
module.exports = User;
