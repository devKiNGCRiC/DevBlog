// ============================================================
// tests/feed-xml.test.js — RSS feed and sitemap
// ============================================================

const request = require("supertest");
const app = require("../app");
const {
    connectTestDB,
    clearTestDB,
    closeTestDB,
    createUser,
    createPost,
} = require("./helpers");

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

describe("GET /api/feed/rss.xml", () => {
    it("lists live posts with escaped titles, and skips drafts", async () => {
        const { user: author } = await createUser();
        const post = await createPost(author, { title: "Tips & <Tricks>" });
        await createPost(author, { title: "Secret draft", isPublished: false });

        const res = await request(app).get("/api/feed/rss.xml");

        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/application\/rss\+xml/);
        expect(res.text).toContain("<title>Tips &amp; &lt;Tricks&gt;</title>");
        expect(res.text).toContain(`<link>http://localhost:5173/post/${post.slug}</link>`);
        expect(res.text).not.toContain("Secret draft");
    });
});

describe("GET /api/feed/sitemap.xml", () => {
    it("lists static pages, live posts and their authors' profiles", async () => {
        const { user: author } = await createUser();
        const post = await createPost(author, { title: "Hello sitemap" });
        await createPost(author, { title: "Hidden", isPublished: false });

        const res = await request(app).get("/api/feed/sitemap.xml");

        expect(res.status).toBe(200);
        expect(res.text).toContain("<loc>http://localhost:5173/</loc>");
        expect(res.text).toContain(`<loc>http://localhost:5173/post/${post.slug}</loc>`);
        expect(res.text).toContain(`<loc>http://localhost:5173/profile/${author.username}</loc>`);
        expect(res.text).not.toContain("hidden");
    });
});
