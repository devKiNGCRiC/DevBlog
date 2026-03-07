// ============================================================
// models/Post.model.js — Blog Post Database Schema
//
// Every blog post that gets created is stored using this blueprint.
// It includes everything: the title, content, author, likes, tags...
// Think of this like the form a journalist fills when writing an article.
// ============================================================

const mongoose = require("mongoose");
const slugify = require("slugify"); // Tool to create URL-friendly strings

// Helper function: estimate how many minutes a post takes to read
// Average reading speed is about 200 words per minute
const calculateReadTime = (content) => {
    // Remove HTML tags from rich text content, then count words
    const text = content.replace(/<[^>]*>/g, ""); // Strip HTML tags
    const wordCount = text.split(/\s+/).filter(Boolean).length; // Count words
    return Math.ceil(wordCount / 200); // Round up to nearest minute
};

const postSchema = new mongoose.Schema(
    {
        // --- Post Identity ---
        title: {
            type: String,
            required: [true, "Post title is required"],
            trim: true,
            maxlength: [150, "Title cannot be more than 150 characters"],
        },

        // "slug" is the URL-friendly version of the title
        // Example: "My First Blog Post!" → "my-first-blog-post"
        slug: {
            type: String,
            unique: true, // Each post needs a unique URL
        },

        // --- Post Content ---
        content: {
            type: String, // HTML string from the rich text editor (React Quill)
            required: [true, "Post content is required"],
        },

        excerpt: {
            type: String, // Short preview text shown on the post cards
            maxlength: [300, "Excerpt cannot be more than 300 characters"],
            default: "",
        },

        coverImage: {
            type: String, // URL of cover image from Cloudinary
            default: "",
        },

        coverImagePublicId: {
            type: String, // Cloudinary's internal ID — needed to delete the image later
            default: "",
        },

        // --- Author ---
        author: {
            type: mongoose.Schema.Types.ObjectId, // Stores the ID of the User who wrote this
            ref: "User", // Links to the User model
            required: true,
        },

        // --- Organization ---
        categories: [
            {
                type: String, // Category names like "Technology", "Travel", etc.
                trim: true,
                lowercase: true, // Always store as lowercase for consistency
            },
        ],

        tags: [
            {
                type: String, // Tags like "javascript", "nodejs", "react"
                trim: true,
                lowercase: true,
            },
        ],

        // --- Engagement ---
        // Array of user IDs who liked this post
        // When someone likes, their ID is added. When they unlike, it's removed.
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        // Array of user IDs who bookmarked this post
        bookmarks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        // Number of times this post was viewed (incremented on each visit)
        views: {
            type: Number,
            default: 0,
        },

        // --- Metadata ---
        readTime: {
            type: Number, // Estimated minutes to read (calculated automatically)
            default: 1,
        },

        isPublished: {
            type: Boolean, // true = visible to everyone, false = draft (only author sees)
            default: false,
        },

        publishedAt: {
            type: Date, // The date and time when the post was first published
            default: null,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt automatically
        // "toJSON: { virtuals: true }" makes virtual fields show up when converting to JSON
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ============================================================
// VIRTUAL FIELD: likeCount
//
// "Virtual" fields don't get stored in the database.
// They are CALCULATED on the fly when you access them.
// likeCount = length of the likes array
// ============================================================
postSchema.virtual("likeCount").get(function () {
    return this.likes?.length ?? 0;
});

// Similarly, count the number of bookmarks
postSchema.virtual("bookmarkCount").get(function () {
    return this.bookmarks?.length ?? 0;
});

// ============================================================
// MIDDLEWARE: Before saving, auto-generate slug and read time
// ============================================================
postSchema.pre("save", async function () {
    // Only regenerate slug if the title was changed
    if (this.isModified("title")) {
        // slugify turns "Hello World! 2024" into "hello-world-2024"
        let baseSlug = slugify(this.title, {
            lower: true, // Lowercase
            strict: true, // Remove special characters
        });

        // Check if a post with this slug already exists (to avoid duplicates)
        let slugExists = await mongoose.model("Post").findOne({ slug: baseSlug });
        if (slugExists && slugExists._id.toString() !== this._id.toString()) {
            // If slug exists, add a timestamp to make it unique
            baseSlug = `${baseSlug}-${Date.now()}`;
        }
        this.slug = baseSlug;
    }

    // Recalculate read time whenever content changes
    if (this.isModified("content")) {
        this.readTime = calculateReadTime(this.content);
    }

    // Auto-generate excerpt from content if not provided
    if (this.isModified("content") && !this.excerpt) {
        const plainText = this.content.replace(/<[^>]*>/g, ""); // Remove HTML tags
        this.excerpt = plainText.substring(0, 250) + "..."; // First 250 characters
    }

    // Set publishedAt date when post is first published
    if (this.isModified("isPublished") && this.isPublished && !this.publishedAt) {
        this.publishedAt = new Date();
    }
});

// ============================================================
// INDEX: Make search faster
//
// Indexes are like the index at the back of a textbook.
// Without it, MongoDB has to scan EVERY post to find what you want.
// With it, it directly jumps to the right post. Much faster!
// ============================================================
postSchema.index({ title: "text", content: "text", excerpt: "text" }); // Full-text search
postSchema.index({ slug: 1 }); // Unique slug lookups
postSchema.index({ author: 1 }); // Fast lookups by author
postSchema.index({ categories: 1 }); // Fast lookups by category
postSchema.index({ tags: 1 }); // Fast lookups by tag
postSchema.index({ createdAt: -1 }); // Show newest posts first (-1 = descending)

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
