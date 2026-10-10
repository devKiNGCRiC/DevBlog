// ============================================================
// controllers/auth.controller.js — Authentication Logic
//
// Controllers contain the actual BUSINESS LOGIC for each route.
// Think of routes as the "address" and controllers as the "workers"
// who actually do the job when you arrive at that address.
//
// This file handles:
// - User registration (sign up)
// - User login
// - Getting current user info
// - Updating profile
// ============================================================

const crypto = require("crypto"); // Node.js built-in for generating secure random tokens
const User = require("../models/User.model"); // User database model
const generateToken = require("../utils/generateToken"); // JWT token generator
const { cloudinary } = require("../config/cloudinary"); // For deleting old images
const sendEmail = require("../utils/sendEmail"); // Email sending utility

// Returns true only if every value is a non-empty string.
// SECURITY: req.body is parsed JSON, so a field can arrive as an object like
// { "$ne": "" }. Passed into a Mongo query, that becomes an operator and matches
// ANY document (NoSQL injection). Rejecting non-strings closes that hole.
const areNonEmptyStrings = (...values) =>
    values.every((value) => typeof value === "string" && value.length > 0);

// ============================================================
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (anyone can access this)
// ============================================================
const register = async (req, res) => {
    // Destructure (extract) the fields sent in the request body
    const { name, username, email, password } = req.body;

    // Check if all required fields are provided
    if (!areNonEmptyStrings(name, username, email, password)) {
        return res.status(400).json({
            success: false,
            message: "Please provide all required fields",
        });
    }

    // Run both existence checks in parallel to save a DB round-trip
    const [emailExists, usernameExists] = await Promise.all([
        User.findOne({ email }),
        User.findOne({ username }),
    ]);

    if (emailExists) {
        return res.status(400).json({
            success: false,
            message: "An account with this email already exists",
        });
    }

    if (usernameExists) {
        return res.status(400).json({
            success: false,
            message: "This username is already taken",
        });
    }

    // Generate a secure random email verification token (hex string)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create the new user in the database
    // The password will be automatically hashed by our User model's pre-save hook
    const user = await User.create({
        name, username, email, password,
        verificationToken,
        verificationTokenExpiry,
    });

    // Send verification email (non-blocking — don't fail registration if email fails)
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    sendEmail({
        to: user.email,
        subject: "Verify your DevBlog email address",
        html: `
            <h2>Welcome to DevBlog, ${user.name}!</h2>
            <p>Please verify your email address by clicking the link below:</p>
            <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;">
                Verify Email
            </a>
            <p>This link expires in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
        `,
    }).catch((err) => {
        console.error("Failed to send verification email:", err.message);
    });

    // Generate a JWT token for the newly registered user
    const token = generateToken(user._id);

    // Send back success response with token and user info
    res.status(201).json({
        // 201 = Created (new resource was made)
        success: true,
        message: "Account created successfully! Please check your email to verify your account.",
        token, // The JWT token — frontend must save this and send it with future requests
        user: {
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            role: user.role,
            isVerified: user.isVerified,
        },
    });
};

// ============================================================
// @desc    Login an existing user
// @route   POST /api/auth/login
// @access  Public
// ============================================================
const login = async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!areNonEmptyStrings(email, password)) {
        return res.status(400).json({
            success: false,
            message: "Please provide email and password",
        });
    }

    // Find user by email
    // We use ".select('+password')" because password has "select: false" in schema
    // We need the password here to compare it — special exception!
    const user = await User.findOne({ email }).select("+password");

    // If user not found OR password doesn't match
    // We give the same error message for both — for security!
    // (If we say "user not found", hackers know the email doesn't exist)
    if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password",
        });
    }

    // Login successful! Generate token
    const token = generateToken(user._id);

    res.status(200).json({
        success: true,
        message: "Login successful! Welcome back!",
        token,
        user: {
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            role: user.role,
            isVerified: user.isVerified,
        },
    });
};

// ============================================================
// @desc    Get currently logged in user's info
// @route   GET /api/auth/me
// @access  Private (must be logged in)
// ============================================================
const getMe = async (req, res) => {
    // req.user is set by our protect middleware
    // We re-fetch from database to get the most up-to-date info
    const user = await User.findById(req.user._id)
        .select("-password") // Never send password
        .populate("followers", "name username profilePicture") // Get follower details
        .populate("following", "name username profilePicture"); // Get following details

    res.status(200).json({
        success: true,
        user,
    });
};

// ============================================================
// @desc    Update current user's profile
// @route   PUT /api/auth/profile
// @access  Private
// ============================================================
const updateProfile = async (req, res) => {
    // Fields that can be updated
    const { name, bio, website, location } = req.body;

    // Build an object with only the fields that were actually sent
    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (location !== undefined) updateData.location = location;

    // Helper to upload a buffer to Cloudinary
    const uploadToCloudinary = (buffer, options) =>
        new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { resource_type: "image", ...options },
                (error, result) => (error ? reject(error) : resolve(result))
            );
            stream.end(buffer);
        });

    // Helper to safely delete an old Cloudinary image by URL
    const deleteOldImage = async (url) => {
        if (!url || !url.includes("cloudinary") || url.includes("/demo/")) return;
        try {
            const urlParts = url.split("/upload/");
            if (urlParts.length === 2) {
                const publicId = urlParts[1].replace(/^v\d+\//, "").replace(/\.[^/.]+$/, "");
                await cloudinary.uploader.destroy(publicId).catch(() => {});
            }
        } catch {
            // Non-critical — ignore
        }
    };

    // Handle profile picture upload (req.files.profilePicture from multer .fields())
    const profilePictureFile = req.files?.profilePicture?.[0];
    if (profilePictureFile) {
        await deleteOldImage(req.user.profilePicture);
        const result = await uploadToCloudinary(profilePictureFile.buffer, {
            folder: "devblog/profiles",
            transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto" }],
        });
        updateData.profilePicture = result.secure_url;
    }

    // Handle cover image upload
    const coverImageFile = req.files?.coverImage?.[0];
    if (coverImageFile) {
        await deleteOldImage(req.user.coverImage);
        const result = await uploadToCloudinary(coverImageFile.buffer, {
            folder: "devblog/covers",
            transformation: [{ width: 1500, height: 500, crop: "fill", quality: "auto" }],
        });
        updateData.coverImage = result.secure_url;
    }

    // Update the user in the database
    // "new: true" means: return the UPDATED document, not the old one
    // "runValidators: true" means: apply schema validation rules on update too
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
        success: true,
        message: "Profile updated successfully!",
        user: updatedUser,
    });
};

// ============================================================
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
// ============================================================
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!areNonEmptyStrings(currentPassword, newPassword)) {
        return res.status(400).json({
            success: false,
            message: "Please provide current and new passwords",
        });
    }

    // Enforce minimum password length with a clear user-facing message
    if (newPassword.length < 8) {
        return res.status(400).json({
            success: false,
            message: "New password must be at least 8 characters",
        });
    }

    // Fetch user WITH password (since select:false in schema)
    const user = await User.findById(req.user._id).select("+password");

    // Verify old password is correct
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: "Current password is incorrect",
        });
    }

    // Set new password (will be hashed automatically by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Password changed successfully!",
    });
};

// ============================================================
// @desc    Verify email address using token from email link
// @route   GET /api/auth/verify-email?token=...
// @access  Public
// ============================================================
const verifyEmail = async (req, res) => {
    const { token } = req.query;

    if (!areNonEmptyStrings(token)) {
        return res.status(400).json({ success: false, message: "Verification token is required" });
    }

    // Find user with this token that hasn't expired yet
    const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpiry: { $gt: new Date() }, // Token must not be expired
    }).select("+verificationToken +verificationTokenExpiry");

    if (!user) {
        return res.status(400).json({
            success: false,
            message: "Invalid or expired verification token. Please request a new one.",
        });
    }

    // Mark as verified and clear the token
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Email verified successfully! You can now log in.",
    });
};

// ============================================================
// @desc    Resend email verification link
// @route   POST /api/auth/resend-verification
// @access  Private (must be logged in but not yet verified)
// ============================================================
const resendVerification = async (req, res) => {
    const user = await User.findById(req.user._id).select("+verificationToken +verificationTokenExpiry");

    if (user.isVerified) {
        return res.status(400).json({ success: false, message: "Your email is already verified." });
    }

    // Generate a new token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await sendEmail({
        to: user.email,
        subject: "Verify your DevBlog email address",
        html: `
            <h2>Email Verification</h2>
            <p>Click the link below to verify your email address:</p>
            <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;">
                Verify Email
            </a>
            <p>This link expires in 24 hours.</p>
        `,
    });

    res.status(200).json({
        success: true,
        message: "Verification email sent! Please check your inbox.",
    });
};

// ============================================================
// @desc    Request a password reset link (for users who forgot their password)
// @route   POST /api/auth/forgot-password
// @access  Public
// ============================================================
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!areNonEmptyStrings(email)) {
        return res.status(400).json({ success: false, message: "Please provide your email address" });
    }

    const user = await User.findOne({ email });

    // Always return the same success message whether or not the account exists —
    // this prevents attackers from using this endpoint to check which emails are registered.
    const genericMessage = "If an account with that email exists, a password reset link has been sent.";

    if (!user) {
        return res.status(200).json({ success: true, message: genericMessage });
    }

    // Generate a secure random reset token (hex string), same approach as email verification
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    try {
        await sendEmail({
            to: user.email,
            subject: "Reset your DevBlog password",
            html: `
                <h2>Password Reset Request</h2>
                <p>Hi ${user.name}, we received a request to reset your DevBlog password.</p>
                <p>Click the link below to choose a new password:</p>
                <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;">
                    Reset Password
                </a>
                <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            `,
        });
    } catch (err) {
        // Don't leak email-sending failures to the client — just log them.
        // Clear the token so a broken email service doesn't leave a dangling reset link.
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();
        console.error("Failed to send password reset email:", err.message);
        return res.status(500).json({
            success: false,
            message: "Failed to send reset email. Please try again later.",
        });
    }

    res.status(200).json({ success: true, message: genericMessage });
};

// ============================================================
// @desc    Reset password using the token from the reset email
// @route   POST /api/auth/reset-password
// @access  Public
// ============================================================
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!areNonEmptyStrings(token, newPassword)) {
        return res.status(400).json({
            success: false,
            message: "Reset token and new password are required",
        });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({
            success: false,
            message: "New password must be at least 8 characters",
        });
    }

    // Find user with this token that hasn't expired yet
    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpiry +password");

    if (!user) {
        return res.status(400).json({
            success: false,
            message: "Invalid or expired reset link. Please request a new one.",
        });
    }

    // Set new password (hashed automatically by the pre-save hook) and clear the token
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Password reset successfully! You can now log in with your new password.",
    });
};

// Export all controller functions so routes can use them
module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
};
