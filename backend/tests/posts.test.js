// ============================================================
// tests/posts.test.js — Post ownership, drafts, sanitising, likes, comments
// ============================================================

const request = require("supertest");
const app = require("../app");
const Post = require("../models/Post.model");
const Comment = require("../models/Comment.model");
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

describe("POST /api/posts", () => {
    it("requires login", async () => {
        const res = await request(app)
            .post("/api/posts")
            .send({ title: "Hello", content: "<p>Hi</p>" });

        expect(res.status).toBe(401);
    });

    it("creates a post with a slug and strips <script> from the content", async () => {
        const { token } = await createUser();

        const res = await request(app)
            .post("/api/posts")
            .set("Authorization", bearer(token))
            .send({
                title: "Hello World",
                content: '<p>Safe text</p><script>alert("xss")</script>',
                isPublished: true,
            });

        expect(res.status).toBe(201);
        expect(res.body.post.slug).toBe("hello-world");
        expect(res.body.post.content).toContain("Safe text");
        expect(res.body.post.content).not.toContain("<script>");
    });
});

describe("Editing and deleting posts", () => {
    it("lets the author edit their own post", async () => {
        const { user: author, token } = await createUser();
        const post = await createPost(author);

        const res = await request(app)
            .put(`/api/posts/${post._id}`)
            .set("Authorization", bearer(token))
            .send({ title: "Updated title" });

        expect(res.status).toBe(200);
        expect(res.body.post.title).toBe("Updated title");
    });

    it("stops another user from editing or deleting the post", async () => {
        const { user: author } = await createUser();
        const { token: strangerToken } = await createUser();
        const post = await createPost(author);

        const edit = await request(app)
            .put(`/api/posts/${post._id}`)
            .set("Authorization", bearer(strangerToken))
            .send({ title: "Hijacked" });
        const remove = await request(app)
            .delete(`/api/posts/${post._id}`)
            .set("Authorization", bearer(strangerToken));

        expect(edit.status).toBe(403);
        expect(remove.status).toBe(403);
        expect((await Post.findById(post._id)).title).toBe(post.title);
    });

    it("lets an admin delete anyone's post, along with its comments", async () => {
        const { user: author } = await createUser();
        const { token: adminToken } = await createUser({ role: "admin" });
        const post = await createPost(author);
        await Comment.create({ content: "Nice", author: author._id, post: post._id });

        const res = await request(app)
            .delete(`/api/posts/${post._id}`)
            .set("Authorization", bearer(adminToken));

        expect(res.status).toBe(200);
        expect(await Post.findById(post._id)).toBeNull();
        expect(await Comment.countDocuments({ post: post._id })).toBe(0);
    });
});

describe("Drafts stay private", () => {
    it("are hidden from the public feed and the public slug URL", async () => {
        const { user: author } = await createUser();
        await createPost(author, { title: "Public post" });
        const draft = await createPost(author, { title: "Secret draft", isPublished: false });

        const feed = await request(app).get("/api/posts");
        const bySlug = await request(app).get(`/api/posts/slug/${draft.slug}`);

        expect(feed.status).toBe(200);
        expect(feed.body.posts.map((p) => p.title)).toEqual(["Public post"]);
        expect(bySlug.status).toBe(404);
    });

    it("are visible to the author in edit mode but not to other users", async () => {
        const { user: author, token: authorToken } = await createUser();
        const { token: strangerToken } = await createUser();
        const draft = await createPost(author, { isPublished: false });

        const asAuthor = await request(app)
            .get(`/api/posts/id/${draft._id}`)
            .set("Authorization", bearer(authorToken));
        const asStranger = await request(app)
            .get(`/api/posts/id/${draft._id}`)
            .set("Authorization", bearer(strangerToken));

        expect(asAuthor.status).toBe(200);
        expect(asStranger.status).toBe(404);
    });
});

describe("POST /api/posts/:id/like", () => {
    it("toggles the like on and off", async () => {
        const { user: author } = await createUser();
        const { user: reader, token } = await createUser();
        const post = await createPost(author);

        const like = await request(app)
            .post(`/api/posts/${post._id}/like`)
            .set("Authorization", bearer(token));
        expect(like.body.liked).toBe(true);
        expect((await Post.findById(post._id)).likes.map(String)).toEqual([String(reader._id)]);

        const unlike = await request(app)
            .post(`/api/posts/${post._id}/like`)
            .set("Authorization", bearer(token));
        expect(unlike.body.liked).toBe(false);
        expect((await Post.findById(post._id)).likes).toHaveLength(0);
    });
});

describe("Comments", () => {
    it("nests replies under their parent comment", async () => {
        const { user: author, token } = await createUser();
        const post = await createPost(author);

        const parent = await request(app)
            .post(`/api/posts/${post._id}/comments`)
            .set("Authorization", bearer(token))
            .send({ content: "Top-level comment" });
        await request(app)
            .post(`/api/posts/${post._id}/comments`)
            .set("Authorization", bearer(token))
            .send({ content: "A reply", parentCommentId: parent.body.comment._id });

        const res = await request(app).get(`/api/posts/${post._id}/comments`);

        expect(res.status).toBe(200);
        expect(res.body.totalComments).toBe(2);
        expect(res.body.comments).toHaveLength(1);
        expect(res.body.comments[0].replies[0].content).toBe("A reply");
    });

    it("can only be deleted by its author (or an admin)", async () => {
        const { user: author, token: authorToken } = await createUser();
        const { token: strangerToken } = await createUser();
        const post = await createPost(author);
        const comment = await Comment.create({ content: "Mine", author: author._id, post: post._id });

        const asStranger = await request(app)
            .delete(`/api/comments/${comment._id}`)
            .set("Authorization", bearer(strangerToken));
        expect(asStranger.status).toBe(403);

        const asAuthor = await request(app)
            .delete(`/api/comments/${comment._id}`)
            .set("Authorization", bearer(authorToken));
        expect(asAuthor.status).toBe(200);
        expect((await Comment.findById(comment._id)).isDeleted).toBe(true);
    });
});

describe("GET /api/posts/:id/related", () => {
    it("ranks posts by shared tags/categories and skips drafts and unrelated posts", async () => {
        const { user: author } = await createUser();
        const post = await createPost(author, { tags: ["react", "hooks"], categories: ["programming"] });
        await createPost(author, { title: "Shares a category", categories: ["programming"] });
        await createPost(author, { title: "Shares two tags", tags: ["react", "hooks"] });
        await createPost(author, { title: "Unrelated", tags: ["cooking"] });
        await createPost(author, { title: "Related draft", tags: ["react"], isPublished: false });

        const res = await request(app).get(`/api/posts/${post._id}/related`);

        expect(res.status).toBe(200);
        expect(res.body.posts.map((p) => p.title)).toEqual(["Shares two tags", "Shares a category"]);
        expect(res.body.posts[0].author.username).toBe(author.username);
        expect(res.body.posts[0].content).toBeUndefined();
    });
});

describe("View counting", () => {
    const viewsOf = async (post) => (await Post.findById(post._id)).views;

    it("counts a guest once per 24h, however often they refresh", async () => {
        const { user: author } = await createUser();
        const post = await createPost(author);

        await request(app).get(`/api/posts/slug/${post.slug}`);
        await request(app).get(`/api/posts/slug/${post.slug}`);
        await request(app).get(`/api/posts/slug/${post.slug}`);

        expect(await viewsOf(post)).toBe(1);
    });

    it("counts each logged-in reader separately and ignores the author", async () => {
        const { user: author, token: authorToken } = await createUser();
        const { token: readerA } = await createUser();
        const { token: readerB } = await createUser();
        const post = await createPost(author);

        for (const token of [authorToken, readerA, readerA, readerB]) {
            await request(app).get(`/api/posts/slug/${post.slug}`).set("Authorization", bearer(token));
        }

        expect(await viewsOf(post)).toBe(2);
    });
});

describe("Scheduled publishing", () => {
    const inOneHour = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

    it("keeps a scheduled post hidden from the public until its time", async () => {
        const { token } = await createUser();
        const { token: strangerToken } = await createUser();

        const res = await request(app)
            .post("/api/posts")
            .set("Authorization", bearer(token))
            .send({ title: "Coming soon", content: "<p>Soon</p>", scheduledAt: inOneHour() });
        expect(res.status).toBe(201);
        expect(res.body.post.isPublished).toBe(true);

        const { slug, _id } = res.body.post;
        expect((await request(app).get("/api/posts")).body.posts).toHaveLength(0);
        expect((await request(app).get(`/api/posts/slug/${slug}`)).status).toBe(404);
        expect((await request(app).get(`/api/posts/id/${_id}`).set("Authorization", bearer(strangerToken))).status).toBe(404);
        expect((await request(app).get(`/api/posts/id/${_id}`).set("Authorization", bearer(token))).status).toBe(200);

        // Once the scheduled time has passed, it's live — no background job needed
        await Post.updateOne({ _id }, { scheduledAt: new Date(Date.now() - 1000) });
        expect((await request(app).get(`/api/posts/slug/${slug}`)).status).toBe(200);
    });

    it("rejects a schedule in the past", async () => {
        const { token } = await createUser();
        const res = await request(app)
            .post("/api/posts")
            .set("Authorization", bearer(token))
            .send({ title: "Too late", content: "<p>x</p>", scheduledAt: "2000-01-01T00:00:00Z" });
        expect(res.status).toBe(400);
    });

    it("can be cleared to publish immediately", async () => {
        const { user: author, token } = await createUser();
        const post = await createPost(author, { scheduledAt: new Date(Date.now() + 3600 * 1000) });

        await request(app)
            .put(`/api/posts/${post._id}`)
            .set("Authorization", bearer(token))
            .send({ scheduledAt: "" });

        const res = await request(app).get(`/api/posts/slug/${post.slug}`);
        expect(res.status).toBe(200);
        expect(new Date(res.body.post.publishedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });
});

describe("GET /api/posts/my-stats", () => {
    it("totals my posts' views, likes and comments, and charts recent activity", async () => {
        const { user: author, token } = await createUser();
        const { token: readerToken } = await createUser();
        const post = await createPost(author, { views: 10 });
        await createPost(author, { views: 5 });

        await request(app).post(`/api/posts/${post._id}/like`).set("Authorization", bearer(readerToken));
        await request(app)
            .post(`/api/posts/${post._id}/comments`)
            .set("Authorization", bearer(readerToken))
            .send({ content: "Nice" });

        const res = await request(app).get("/api/posts/my-stats").set("Authorization", bearer(token));

        expect(res.status).toBe(200);
        expect(res.body.totals).toMatchObject({ posts: 2, views: 15, likes: 1, comments: 1 });
        expect(res.body.posts[0]).toMatchObject({ views: 10, likes: 1, comments: 1 });
        expect(res.body.activity).toHaveLength(30);
        const today = res.body.activity[29];
        expect(today).toMatchObject({ likes: 1, comments: 1 });
    });
});
