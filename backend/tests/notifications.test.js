// ============================================================
// tests/notifications.test.js — Likes, comments, replies and follows notify people
// ============================================================

const request = require("supertest");
const app = require("../app");
const Notification = require("../models/Notification.model");
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

const typesFor = async (user) =>
    (await Notification.find({ recipient: user._id })).map((n) => n.type).sort();

describe("Creating notifications", () => {
    it("notifies the author on a like, and removes it again on unlike", async () => {
        const { user: author } = await createUser();
        const { token } = await createUser();
        const post = await createPost(author);

        await request(app).post(`/api/posts/${post._id}/like`).set("Authorization", bearer(token));
        expect(await typesFor(author)).toEqual(["like"]);

        await request(app).post(`/api/posts/${post._id}/like`).set("Authorization", bearer(token));
        expect(await typesFor(author)).toEqual([]);
    });

    it("does not notify you about your own actions", async () => {
        const { user: author, token } = await createUser();
        const post = await createPost(author);

        await request(app).post(`/api/posts/${post._id}/like`).set("Authorization", bearer(token));
        await request(app)
            .post(`/api/posts/${post._id}/comments`)
            .set("Authorization", bearer(token))
            .send({ content: "Talking to myself" });

        expect(await typesFor(author)).toEqual([]);
    });

    it("notifies the post author of comments and the parent author of replies", async () => {
        const { user: author } = await createUser();
        const { user: commenter, token: commenterToken } = await createUser();
        const { token: replierToken } = await createUser();
        const post = await createPost(author);

        const top = await request(app)
            .post(`/api/posts/${post._id}/comments`)
            .set("Authorization", bearer(commenterToken))
            .send({ content: "Great post" });
        await request(app)
            .post(`/api/posts/${post._id}/comments`)
            .set("Authorization", bearer(replierToken))
            .send({ content: "Agreed", parentCommentId: top.body.comment._id });

        expect(await typesFor(author)).toEqual(["comment", "comment"]);
        expect(await typesFor(commenter)).toEqual(["reply"]);
    });

    it("notifies on follow and removes it on unfollow", async () => {
        const { user: target } = await createUser();
        const { token } = await createUser();

        await request(app).post(`/api/users/${target._id}/follow`).set("Authorization", bearer(token));
        expect(await typesFor(target)).toEqual(["follow"]);

        await request(app).post(`/api/users/${target._id}/follow`).set("Authorization", bearer(token));
        expect(await typesFor(target)).toEqual([]);
    });
});

describe("/api/notifications", () => {
    it("lists my notifications with an unread count, and marks them read", async () => {
        const { user: target, token: targetToken } = await createUser();
        const { token } = await createUser();
        await request(app).post(`/api/users/${target._id}/follow`).set("Authorization", bearer(token));

        const list = await request(app).get("/api/notifications").set("Authorization", bearer(targetToken));
        expect(list.status).toBe(200);
        expect(list.body.unreadCount).toBe(1);
        expect(list.body.notifications[0].actor.username).toBeDefined();

        await request(app).put("/api/notifications/read-all").set("Authorization", bearer(targetToken));
        const count = await request(app)
            .get("/api/notifications/unread-count")
            .set("Authorization", bearer(targetToken));
        expect(count.body.unreadCount).toBe(0);
    });

    it("won't let you mark someone else's notification as read", async () => {
        const { user: target } = await createUser();
        const { token } = await createUser();
        const { token: strangerToken } = await createUser();
        await request(app).post(`/api/users/${target._id}/follow`).set("Authorization", bearer(token));
        const notification = await Notification.findOne({ recipient: target._id });

        const res = await request(app)
            .put(`/api/notifications/${notification._id}/read`)
            .set("Authorization", bearer(strangerToken));

        expect(res.status).toBe(404);
        expect((await Notification.findById(notification._id)).read).toBe(false);
    });

    it("requires login", async () => {
        expect((await request(app).get("/api/notifications")).status).toBe(401);
    });
});
