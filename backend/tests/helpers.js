// ============================================================
// tests/helpers.js — Shared test utilities
//
// - An in-memory MongoDB (mongodb-memory-server) so every test file
//   gets a fresh, throwaway database.
// - Small factories to create users and posts directly in the DB,
//   so each test only goes through the API for what it is testing.
// ============================================================

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../models/User.model");
const Post = require("../models/Post.model");
const generateToken = require("../utils/generateToken");

let mongoServer;

// Call these from beforeAll / afterEach / afterAll in each test file
const connectTestDB = async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
};

const clearTestDB = async () => {
    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

const closeTestDB = async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
};

let userCounter = 0;

// Creates a user and returns { user, token, password }
const createUser = async (overrides = {}) => {
    userCounter += 1;
    const password = overrides.password || "password123";
    const user = await User.create({
        name: `Test User ${userCounter}`,
        username: `user${userCounter}`,
        email: `user${userCounter}@example.com`,
        ...overrides,
        password,
    });
    return { user, token: generateToken(user._id), password };
};

const createPost = async (author, overrides = {}) =>
    Post.create({
        title: `Post ${Date.now()} ${Math.random()}`,
        content: "<p>Some post content</p>",
        author: author._id,
        isPublished: true,
        ...overrides,
    });

// "Authorization: Bearer <token>" header value
const bearer = (token) => `Bearer ${token}`;

module.exports = {
    connectTestDB,
    clearTestDB,
    closeTestDB,
    createUser,
    createPost,
    bearer,
};
