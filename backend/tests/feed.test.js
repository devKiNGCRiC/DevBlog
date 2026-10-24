// ============================================================
// tests/feed.test.js — "Following" feed on GET /api/posts
// ============================================================

const request = require("supertest");
const app = require("../app");
const User = require("../models/User.model");
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

describe("GET /api/posts?feed=following", () => {
    it("requires login", async () => {
        const res = await request(app).get("/api/posts?feed=following");
        expect(res.status).toBe(401);
    });

    it("only returns posts from authors the user follows", async () => {
        const { user: followed } = await createUser();
        const { user: stranger } = await createUser();
        const { user: reader, token } = await createUser();
        await User.findByIdAndUpdate(reader._id, { $addToSet: { following: followed._id } });

        await createPost(followed, { title: "From someone I follow" });
        await createPost(stranger, { title: "From a stranger" });

        const res = await request(app)
            .get("/api/posts?feed=following")
            .set("Authorization", bearer(token));

        expect(res.status).toBe(200);
        expect(res.body.posts.map((p) => p.title)).toEqual(["From someone I follow"]);
    });

    it("still serves the normal feed to guests and logged-in users", async () => {
        const { user: author, token } = await createUser();
        await createPost(author);

        const guest = await request(app).get("/api/posts");
        const loggedIn = await request(app).get("/api/posts").set("Authorization", bearer(token));

        expect(guest.body.posts).toHaveLength(1);
        expect(loggedIn.body.posts).toHaveLength(1);
    });
});
