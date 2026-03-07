// ============================================================
// controllers/post.controller.js — Blog Post Logic
//
// This controller handles everything related to blog posts:
// Creating, reading, editing, deleting, liking, bookmarking...
// Think of this as the "manager" for all post operations.
// ============================================================

const Post = require("../models/Post.model"); // Post database model
const User = require("../models/User.model"); // User model (for bookmarks)
const Comment = require("../models/Comment.model"); // Comment model (for cascade delete)
const { cloudinary } = require("../config/cloudinary"); // For image management
const sanitizeHtml = require("sanitize-html"); // Sanitize HTML content to prevent XSS

// Helper: upload a file buffer directly to Cloudinary and return the result.
// Used instead of multer-storage-cloudinary for compatibility with cloudinary v2.
const uploadImageToCloudinary = (buffer, options = {}) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "devblog",
                transformation: [{ width: 1200, height: 630, crop: "limit", quality: "auto" }],
                resource_type: "image",
                ...options,
            },
            (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(buffer);
    });

// Allowed HTML tags and attributes for Quill-generated content
const SANITIZE_OPTIONS = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        "img", "h1", "h2", "h3", "h4", "h5", "h6",
        "blockquote", "pre", "code", "s", "u", "sub", "sup",
    ]),
    allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        "*": ["class", "style"],
        "a": ["href", "name", "target", "rel"],
        "img": ["src", "alt", "width", "height"],
    },
    allowedSchemes: ["http", "https", "data"],
};

// ============================================================
// HELPER: Check if the requesting user is the resource owner or an admin
// Avoids duplicating this check in updatePost and deletePost
// ============================================================
const isOwnerOrAdmin = (resourceAuthorId, requestingUser) => {
    return (
        resourceAuthorId.toString() === requestingUser._id.toString() ||
        requestingUser.role === "admin"
    );
};

// ============================================================
// @desc    Create a new blog post
// @route   POST /api/posts
// @access  Private (must be logged in)
// ============================================================
const createPost = async (req, res) => {
    const { title, content, excerpt, categories, tags, isPublished } = req.body;

    // Validate required fields
    if (!title || !content) {
        return res.status(400).json({
            success: false,
            message: "Title and content are required",
        });
    }

    // Build the post data object
    // Sanitize HTML content from Quill editor to prevent XSS attacks
    const postData = {
        title,
        content: sanitizeHtml(content, SANITIZE_OPTIONS),
        excerpt: excerpt || "", // Use provided excerpt or leave empty (auto-generated in model)
        author: req.user._id, // The logged-in user is the author
        isPublished: isPublished === "true" || isPublished === true, // Convert string to boolean
    };

    // Safely parse categories and tags (guard against invalid JSON from client)
    try {
        postData.categories = categories
            ? typeof categories === "string"
                ? JSON.parse(categories)
                : categories
            : [];
        postData.tags = tags
            ? typeof tags === "string"
                ? JSON.parse(tags)
                : tags
            : [];
    } catch {
        return res.status(400).json({
            success: false,
            message: "Invalid categories or tags format",
        });
    }

    // If a cover image was uploaded, stream the buffer to Cloudinary
    if (req.file) {
        const result = await uploadImageToCloudinary(req.file.buffer);
        postData.coverImage = result.secure_url;
        postData.coverImagePublicId = result.public_id;
    }

    // Create the post in the database
    const post = await Post.create(postData);

    // Return the new post with author details populated
    const populatedPost = await Post.findById(post._id).populate(
        "author",
        "name username profilePicture"
    );

    res.status(201).json({
        success: true,
        message: "Post created successfully!",
        post: populatedPost,
    });
};

// ============================================================
// @desc    Get all published posts (with pagination, search, filter)
// @route   GET /api/posts
// @access  Public
// ============================================================
const getAllPosts = async (req, res) => {
    // Extract query parameters from the URL
    // Example URL: /api/posts?page=2&limit=10&search=javascript&category=tech
    const {
        page = 1, // Which page (default: first page)
        limit = 10, // How many posts per page (default: 10)
        search, // Search keyword
        category, // Filter by category
        tag, // Filter by tag
        author, // Filter by author username
        sortBy = "latest", // How to sort: 'latest', 'popular', 'oldest'
    } = req.query;

    // Build the "filter" object — like a WHERE clause in SQL
    const filter = {
        isPublished: true, // Only show published posts (not drafts)
    };

    // Add search filter if provided
    // "$text" uses MongoDB's full-text search index (we defined this in the model)
    if (search) {
        filter.$text = { $search: search };
    }

    // Add category filter if provided
    if (category) {
        filter.categories = category.toLowerCase();
    }

    // Add tag filter if provided
    if (tag) {
        filter.tags = tag.toLowerCase();
    }

    // Filter by author username if provided
    if (author) {
        const authorUser = await User.findOne({ username: author });
        if (authorUser) {
            filter.author = authorUser._id;
        }
    }

    // Sort options
    let sortOption = {};
    if (sortBy === "latest") sortOption = { createdAt: -1 }; // Newest first
    if (sortBy === "oldest") sortOption = { createdAt: 1 };  // Oldest first
    if (sortBy === "popular") sortOption = { views: -1 };    // Most viewed first
    if (search) sortOption = { score: { $meta: "textScore" } }; // Best search match first

    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let posts;

    // "liked" sort requires aggregation because MongoDB can't sort by array length directly
    if (sortBy === "liked" && !search) {
        posts = await Post.aggregate([
            { $match: filter },
            { $addFields: { likeCount: { $size: "$likes" } } },
            { $sort: { likeCount: -1 } },
            { $skip: skip },
            { $limit: limitNum },
            {
                $lookup: {
                    from: "users",
                    localField: "author",
                    foreignField: "_id",
                    as: "authorData",
                    pipeline: [{ $project: { name: 1, username: 1, profilePicture: 1 } }],
                },
            },
            { $addFields: { author: { $arrayElemAt: ["$authorData", 0] } } },
            { $project: { content: 0, authorData: 0 } },
        ]);
    } else {
        // Standard find() for all other sorts
        posts = await Post.find(filter)
            .populate("author", "name username profilePicture")
            .sort(sortOption)
            .skip(skip)
            .limit(limitNum)
            .select("-content");
    }

    // Count total matching posts (for pagination UI)
    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limitNum);

    res.status(200).json({
        success: true,
        posts,
        pagination: {
            currentPage: pageNum,
            totalPages,
            totalPosts,
            hasNextPage: pageNum < totalPages, // Is there a next page?
            hasPrevPage: pageNum > 1, // Is there a previous page?
        },
    });
};

// ============================================================
// @desc    Get a single post by its MongoDB ID
// @route   GET /api/posts/id/:id
// @access  Private (used by edit page — allows accessing drafts by author)
// ============================================================
const getPostById = async (req, res) => {
    const post = await Post.findById(req.params.id).populate(
        "author",
        "name username profilePicture bio followers"
    );

    if (!post) {
        return res.status(404).json({
            success: false,
            message: "Post not found",
        });
    }

    // Draft posts are only accessible by their author or an admin
    if (!post.isPublished && !isOwnerOrAdmin(post.author._id, req.user)) {
        return res.status(404).json({
            success: false,
            message: "Post not found",
        });
    }

    res.status(200).json({
        success: true,
        post,
    });
};

// ============================================================
// @desc    Get a single post by its slug
// @route   GET /api/posts/:slug
// @access  Public
// ============================================================
const getPostBySlug = async (req, res) => {
    // Find the post with this slug AND it must be published
    const post = await Post.findOne({ slug: req.params.slug, isPublished: true })
        .populate("author", "name username profilePicture bio followers") // Author details
        .populate({
            path: "likes", // Populate likes to check if current user liked it
            select: "_id", // Only need the IDs
        })
        .populate({
            path: "bookmarks", // Populate bookmarks so client can check if user bookmarked
            select: "_id",
        });

    // If no post found with this slug
    if (!post) {
        return res.status(404).json({
            success: false,
            message: "Post not found",
        });
    }

    // Increment view count (someone just viewed this post!)
    // "findByIdAndUpdate" is faster than find + save
    await Post.findByIdAndUpdate(post._id, { $inc: { views: 1 } });

    res.status(200).json({
        success: true,
        post,
    });
};

// ============================================================
// @desc    Get current user's own posts (including drafts)
// @route   GET /api/posts/my-posts
// @access  Private
// ============================================================
const getMyPosts = async (req, res) => {
    const { page = 1, limit = 10, published } = req.query;

    const filter = { author: req.user._id };
    if (published === "true") filter.isPublished = true;
    if (published === "false") filter.isPublished = false;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const posts = await Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("title slug excerpt coverImage isPublished views likes createdAt readTime");

    const total = await Post.countDocuments(filter);

    res.status(200).json({
        success: true,
        posts,
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalPosts: total,
        },
    });
};

// ============================================================
// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private (only the author can edit)
// ============================================================
const updatePost = async (req, res) => {
    // Find the post by ID
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({
            success: false,
            message: "Post not found",
        });
    }

    // Check if the logged-in user is the author (or admin)
    if (!isOwnerOrAdmin(post.author, req.user)) {
        return res.status(403).json({
            success: false,
            message: "You are not allowed to edit this post",
        });
    }

    // Extract updatable fields from request
    const { title, content, excerpt, categories, tags, isPublished } = req.body;

    // Only update fields that were sent
    if (title) post.title = title;
    // Sanitize HTML content to prevent XSS before saving
    if (content) post.content = sanitizeHtml(content, SANITIZE_OPTIONS);
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (isPublished !== undefined)
        post.isPublished = isPublished === "true" || isPublished === true;

    // Safely parse categories and tags
    if (categories) {
        try {
            post.categories = typeof categories === "string" ? JSON.parse(categories) : categories;
        } catch {
            return res.status(400).json({ success: false, message: "Invalid categories format" });
        }
    }
    if (tags) {
        try {
            post.tags = typeof tags === "string" ? JSON.parse(tags) : tags;
        } catch {
            return res.status(400).json({ success: false, message: "Invalid tags format" });
        }
    }

    // Handle new cover image upload
    if (req.file) {
        // Delete old cover image from Cloudinary before uploading the new one
        if (post.coverImagePublicId) {
            await cloudinary.uploader.destroy(post.coverImagePublicId).catch(() => { });
        }
        const result = await uploadImageToCloudinary(req.file.buffer);
        post.coverImage = result.secure_url;
        post.coverImagePublicId = result.public_id;
    }

    // Save the updated post (pre-save hook will regenerate slug and read time if needed)
    await post.save();

    const updatedPost = await Post.findById(post._id).populate(
        "author",
        "name username profilePicture"
    );

    res.status(200).json({
        success: true,
        message: "Post updated successfully!",
        post: updatedPost,
    });
};

// ============================================================
// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private (only author or admin)
// ============================================================
const deletePost = async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({
            success: false,
            message: "Post not found",
        });
    }

    // Only author or admin can delete
    if (!isOwnerOrAdmin(post.author, req.user)) {
        return res.status(403).json({
            success: false,
            message: "You are not allowed to delete this post",
        });
    }

    // Delete cover image from Cloudinary (if it exists)
    if (post.coverImagePublicId) {
        await cloudinary.uploader.destroy(post.coverImagePublicId).catch(() => { });
    }

    // Cascade delete: remove all comments associated with this post
    await Comment.deleteMany({ post: post._id });

    // Delete the post from database
    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: "Post deleted successfully!",
    });
};

// ============================================================
// @desc    Like or Unlike a post (toggle)
// @route   POST /api/posts/:id/like
// @access  Private
// ============================================================
const likePost = async (req, res) => {
    // Fetch only the likes field to check current state — minimal data transfer
    const post = await Post.findById(req.params.id).select("likes");
    if (!post) {
        return res.status(404).json({ success: false, message: "Post not found" });
    }

    const alreadyLiked = post.likes.some(
        (id) => id.toString() === req.user._id.toString()
    );

    // Single atomic update — either pull or addToSet
    const update = alreadyLiked
        ? { $pull: { likes: req.user._id } }
        : { $addToSet: { likes: req.user._id } };

    await Post.findByIdAndUpdate(req.params.id, update);

    return res.status(200).json({
        success: true,
        message: alreadyLiked ? "Post unliked" : "Post liked!",
        liked: !alreadyLiked,
    });
};

// ============================================================
// @desc    Bookmark or Remove Bookmark from a post (toggle)
// @route   POST /api/posts/:id/bookmark
// @access  Private
// ============================================================
const bookmarkPost = async (req, res) => {
    // Fetch only the bookmarks field to check current state
    const post = await Post.findById(req.params.id).select("bookmarks");
    if (!post) {
        return res.status(404).json({ success: false, message: "Post not found" });
    }

    const alreadyBookmarked = post.bookmarks.some(
        (id) => id.toString() === req.user._id.toString()
    );

    // Single atomic update
    const update = alreadyBookmarked
        ? { $pull: { bookmarks: req.user._id } }
        : { $addToSet: { bookmarks: req.user._id } };

    await Post.findByIdAndUpdate(req.params.id, update);

    return res.status(200).json({
        success: true,
        message: alreadyBookmarked ? "Bookmark removed" : "Post bookmarked!",
        bookmarked: !alreadyBookmarked,
    });
};

// ============================================================
// @desc    Get all bookmarked posts for current user
// @route   GET /api/posts/bookmarks
// @access  Private
// ============================================================
const getBookmarkedPosts = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Find all posts where our user's ID is in the bookmarks array
    const posts = await Post.find({
        bookmarks: req.user._id,
        isPublished: true,
    })
        .populate("author", "name username profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("-content");

    const total = await Post.countDocuments({
        bookmarks: req.user._id,
        isPublished: true,
    });

    res.status(200).json({
        success: true,
        posts,
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalPosts: total,
        },
    });
};

// ============================================================
// @desc    Get all distinct categories from published posts
// @route   GET /api/posts/categories
// @access  Public
// ============================================================
const getCategories = async (req, res) => {
    const categories = await Post.distinct("categories", { isPublished: true });
    // Sort alphabetically and filter out empty strings
    const sorted = categories.filter(Boolean).sort();
    res.status(200).json({ success: true, categories: sorted });
};

// Export all post controller functions
module.exports = {
    createPost,
    getAllPosts,
    getPostBySlug,
    getPostById,
    getMyPosts,
    updatePost,
    deletePost,
    likePost,
    bookmarkPost,
    getBookmarkedPosts,
    getCategories,
};
