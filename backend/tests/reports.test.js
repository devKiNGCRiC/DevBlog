// ============================================================
// tests/reports.test.js — Reporting content and admin review
// ============================================================

const request = require("supertest");
const app = require("../app");
const Post = require("../models/Post.model");
const Comment = require("../models/Comment.model");
const Report = require("../models/Report.model");
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

const report = (token, body) =>
    request(app).post("/api/reports").set("Authorization", bearer(token)).send(body);

describe("POST /api/reports", () => {
    it("lets a user report a post once", async () => {
        const { user: author } = await createUser();
        const { token } = await createUser();
        const post = await createPost(author);

        const first = await report(token, { targetType: "post", targetId: String(post._id), reason: "spam" });
        const second = await report(token, { targetType: "post", targetId: String(post._id), reason: "spam" });

        expect(first.status).toBe(201);
        expect(second.status).toBe(409);
        expect(await Report.countDocuments()).toBe(1);
    });

    it("rejects bad reasons and reporting your own content", async () => {
        const { user: author, token: authorToken } = await createUser();
        const { token } = await createUser();
        const post = await createPost(author);

        expect((await report(token, { targetType: "post", targetId: String(post._id), reason: "meh" })).status).toBe(400);
        expect((await report(authorToken, { targetType: "post", targetId: String(post._id), reason: "spam" })).status).toBe(400);
    });
});

describe("Admin report review", () => {
    it("is admin-only", async () => {
        const { token } = await createUser();
        const res = await request(app).get("/api/admin/reports").set("Authorization", bearer(token));
        expect(res.status).toBe(403);
    });

    it("removing a reported comment resolves every open report on it", async () => {
        const { user: author } = await createUser();
        const { token: a } = await createUser();
        const { token: b } = await createUser();
        const { token: adminToken } = await createUser({ role: "admin" });
        const post = await createPost(author);
        const comment = await Comment.create({ content: "Rude", author: author._id, post: post._id });

        await report(a, { targetType: "comment", targetId: String(comment._id), reason: "harassment" });
        await report(b, { targetType: "comment", targetId: String(comment._id), reason: "harassment" });

        const list = await request(app).get("/api/admin/reports").set("Authorization", bearer(adminToken));
        expect(list.body.reports).toHaveLength(2);

        const res = await request(app)
            .put(`/api/admin/reports/${list.body.reports[0]._id}`)
            .set("Authorization", bearer(adminToken))
            .send({ action: "remove" });

        expect(res.status).toBe(200);
        expect((await Comment.findById(comment._id)).isDeleted).toBe(true);
        expect(await Report.countDocuments({ status: "resolved" })).toBe(2);
    });

    it("dismissing keeps the content", async () => {
        const { user: author } = await createUser();
        const { token } = await createUser();
        const { token: adminToken } = await createUser({ role: "admin" });
        const post = await createPost(author);
        await report(token, { targetType: "post", targetId: String(post._id), reason: "other" });
        const open = await Report.findOne();

        await request(app)
            .put(`/api/admin/reports/${open._id}`)
            .set("Authorization", bearer(adminToken))
            .send({ action: "dismiss" });

        expect(await Post.findById(post._id)).not.toBeNull();
        expect((await Report.findById(open._id)).status).toBe("dismissed");
    });

    it("removing a reported post deletes it along with its reports", async () => {
        const { user: author } = await createUser();
        const { token } = await createUser();
        const { token: adminToken } = await createUser({ role: "admin" });
        const post = await createPost(author);
        await report(token, { targetType: "post", targetId: String(post._id), reason: "spam" });
        const open = await Report.findOne();

        await request(app)
            .put(`/api/admin/reports/${open._id}`)
            .set("Authorization", bearer(adminToken))
            .send({ action: "remove" });

        expect(await Post.findById(post._id)).toBeNull();
        expect(await Report.countDocuments()).toBe(0);
    });
});
