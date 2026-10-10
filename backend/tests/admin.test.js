// ============================================================
// tests/admin.test.js — Admin-only moderation endpoints
// ============================================================

const request = require("supertest");
const app = require("../app");
const User = require("../models/User.model");
const Post = require("../models/Post.model");
const {
    connectTestDB,
    clearTestDB,
    closeTestDB,
    createUser,
    createPost,
    bearer,
} = require("./helpers");

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

describe("Access control", () => {
    it("rejects requests without a token", async () => {
        const res = await request(app).get("/api/admin/stats");
        expect(res.status).toBe(401);
    });

    it("rejects logged-in users who are not admins", async () => {
        const { token } = await createUser();

        const res = await request(app)
            .get("/api/admin/stats")
            .set("Authorization", bearer(token));

        expect(res.status).toBe(403);
    });

    it("lets admins see site stats", async () => {
        const { user: admin, token } = await createUser({ role: "admin" });
        await createPost(admin);
        await createPost(admin, { isPublished: false });

        const res = await request(app)
            .get("/api/admin/stats")
            .set("Authorization", bearer(token));

        expect(res.status).toBe(200);
        expect(res.body.stats).toMatchObject({ postCount: 2, publishedCount: 1, draftCount: 1 });
    });
});

describe("PUT /api/admin/users/:id/role", () => {
    it("promotes another user to admin", async () => {
        const { token } = await createUser({ role: "admin" });
        const { user: target } = await createUser();

        const res = await request(app)
            .put(`/api/admin/users/${target._id}/role`)
            .set("Authorization", bearer(token))
            .send({ role: "admin" });

        expect(res.status).toBe(200);
        expect((await User.findById(target._id)).role).toBe("admin");
    });

    it("blocks an admin from changing their own role", async () => {
        const { user: admin, token } = await createUser({ role: "admin" });

        const res = await request(app)
            .put(`/api/admin/users/${admin._id}/role`)
            .set("Authorization", bearer(token))
            .send({ role: "user" });

        expect(res.status).toBe(400);
    });

    it("rejects roles that don't exist", async () => {
        const { token } = await createUser({ role: "admin" });
        const { user: target } = await createUser();

        const res = await request(app)
            .put(`/api/admin/users/${target._id}/role`)
            .set("Authorization", bearer(token))
            .send({ role: "superuser" });

        expect(res.status).toBe(400);
    });
});

describe("DELETE /api/admin/users/:id", () => {
    it("deletes the user, their posts, and their likes on other posts", async () => {
        const { token } = await createUser({ role: "admin" });
        const { user: target } = await createUser();
        const { user: otherAuthor } = await createUser();
        await createPost(target);
        const otherPost = await createPost(otherAuthor, { likes: [target._id] });

        const res = await request(app)
            .delete(`/api/admin/users/${target._id}`)
            .set("Authorization", bearer(token));

        expect(res.status).toBe(200);
        expect(await User.findById(target._id)).toBeNull();
        expect(await Post.countDocuments({ author: target._id })).toBe(0);
        expect((await Post.findById(otherPost._id)).likes).toHaveLength(0);
    });
});
