// ============================================================
// tests/series.test.js — Grouping posts into ordered series
// ============================================================

const request = require("supertest");
const app = require("../app");
const Post = require("../models/Post.model");
const Series = require("../models/Series.model");
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

const newPostInSeries = (token, title, series) =>
    request(app)
        .post("/api/posts")
        .set("Authorization", bearer(token))
        .send({ title, content: "<p>Part</p>", isPublished: true, series: String(series) });

describe("Series", () => {
    it("numbers posts in the order they join, and lists the parts on each post", async () => {
        const { token } = await createUser();
        const created = await request(app)
            .post("/api/series")
            .set("Authorization", bearer(token))
            .send({ title: "Learning Node" });
        expect(created.status).toBe(201);
        const seriesId = created.body.series._id;

        const one = await newPostInSeries(token, "Node part one", seriesId);
        const two = await newPostInSeries(token, "Node part two", seriesId);
        expect(one.body.post.seriesOrder).toBe(1);
        expect(two.body.post.seriesOrder).toBe(2);

        const res = await request(app).get(`/api/posts/slug/${two.body.post.slug}`);
        expect(res.body.seriesNav.title).toBe("Learning Node");
        expect(res.body.seriesNav.parts.map((p) => p.title)).toEqual(["Node part one", "Node part two"]);
    });

    it("won't let you add a post to someone else's series", async () => {
        const { user: owner } = await createUser();
        const { token: strangerToken } = await createUser();
        const series = await Series.create({ title: "Mine", author: owner._id });

        const res = await newPostInSeries(strangerToken, "Sneaky", series._id);
        expect(res.status).toBe(400);
    });

    it("keeps posts when a series is deleted, just ungrouped", async () => {
        const { user: owner, token } = await createUser();
        const { token: strangerToken } = await createUser();
        const series = await Series.create({ title: "Temp", author: owner._id });
        const post = await createPost(owner, { series: series._id, seriesOrder: 1 });

        const asStranger = await request(app).delete(`/api/series/${series._id}`).set("Authorization", bearer(strangerToken));
        expect(asStranger.status).toBe(403);

        const asOwner = await request(app).delete(`/api/series/${series._id}`).set("Authorization", bearer(token));
        expect(asOwner.status).toBe(200);
        const kept = await Post.findById(post._id);
        expect(kept).not.toBeNull();
        expect(kept.series).toBeNull();
    });

    it("lists only my own series", async () => {
        const { user: me, token } = await createUser();
        const { user: other } = await createUser();
        await Series.create({ title: "Mine", author: me._id });
        await Series.create({ title: "Theirs", author: other._id });

        const res = await request(app).get("/api/series/mine").set("Authorization", bearer(token));
        expect(res.body.series.map((s) => s.title)).toEqual(["Mine"]);
    });
});
