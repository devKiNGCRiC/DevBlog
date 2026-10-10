// ============================================================
// tests/auth.test.js — Registration, login, password reset, JWT guard
// ============================================================

// Replace the real email sender so no SMTP server is needed.
// Tests can inspect sendEmail.mock.calls to see what would have been sent.
jest.mock("../utils/sendEmail", () => jest.fn().mockResolvedValue(undefined));

const request = require("supertest");
const app = require("../app");
const User = require("../models/User.model");
const sendEmail = require("../utils/sendEmail");
const { connectTestDB, clearTestDB, closeTestDB, createUser, bearer } = require("./helpers");

beforeAll(connectTestDB);
afterEach(async () => {
    await clearTestDB();
    sendEmail.mockClear();
});
afterAll(closeTestDB);

describe("POST /api/auth/register", () => {
    const newUser = {
        name: "Ada Lovelace",
        username: "ada",
        email: "ada@example.com",
        password: "password123",
    };

    it("creates the user, returns a token, and never returns the password", async () => {
        const res = await request(app).post("/api/auth/register").send(newUser);

        expect(res.status).toBe(201);
        expect(res.body.token).toEqual(expect.any(String));
        expect(res.body.user.username).toBe("ada");
        expect(res.body.user.password).toBeUndefined();

        // Password must be stored hashed, not as plain text
        const saved = await User.findOne({ email: "ada@example.com" }).select("+password");
        expect(saved.password).not.toBe("password123");
        expect(await saved.matchPassword("password123")).toBe(true);

        expect(sendEmail).toHaveBeenCalledTimes(1); // Verification email
    });

    it("rejects a duplicate email", async () => {
        await createUser({ email: "ada@example.com" });

        const res = await request(app).post("/api/auth/register").send(newUser);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/email already exists/i);
    });
});

describe("POST /api/auth/login", () => {
    it("logs in with the correct password", async () => {
        const { user, password } = await createUser();

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: user.email, password });

        expect(res.status).toBe(200);
        expect(res.body.token).toEqual(expect.any(String));
    });

    it("rejects a wrong password with the same message as an unknown email", async () => {
        const { user } = await createUser();

        const wrongPassword = await request(app)
            .post("/api/auth/login")
            .send({ email: user.email, password: "not-the-password" });
        const unknownEmail = await request(app)
            .post("/api/auth/login")
            .send({ email: "nobody@example.com", password: "whatever123" });

        expect(wrongPassword.status).toBe(401);
        expect(unknownEmail.status).toBe(401);
        expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    });

    it("rejects a MongoDB operator in place of the email (NoSQL injection)", async () => {
        await createUser();

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: { $ne: "" }, password: "password123" });

        expect(res.status).toBe(400);
    });
});

describe("Password reset flow", () => {
    const getResetToken = async (email) => {
        const user = await User.findOne({ email }).select("+resetPasswordToken");
        return user.resetPasswordToken;
    };

    it("gives the same answer for unknown emails, so accounts can't be discovered", async () => {
        const res = await request(app)
            .post("/api/auth/forgot-password")
            .send({ email: "nobody@example.com" });

        expect(res.status).toBe(200);
        expect(sendEmail).not.toHaveBeenCalled();
    });

    it("resets the password with a valid token, and the token only works once", async () => {
        const { user } = await createUser();

        await request(app).post("/api/auth/forgot-password").send({ email: user.email });
        expect(sendEmail).toHaveBeenCalledTimes(1);
        const token = await getResetToken(user.email);

        const reset = await request(app)
            .post("/api/auth/reset-password")
            .send({ token, newPassword: "brand-new-pass" });
        expect(reset.status).toBe(200);

        const login = await request(app)
            .post("/api/auth/login")
            .send({ email: user.email, password: "brand-new-pass" });
        expect(login.status).toBe(200);

        const reuse = await request(app)
            .post("/api/auth/reset-password")
            .send({ token, newPassword: "another-pass-1" });
        expect(reuse.status).toBe(400);
    });

    it("cannot be hijacked with a MongoDB operator as the token (account takeover)", async () => {
        const { user: victim, password } = await createUser({ role: "admin" });

        // Attacker triggers a reset for the victim, then guesses the token with an operator
        await request(app).post("/api/auth/forgot-password").send({ email: victim.email });
        const res = await request(app)
            .post("/api/auth/reset-password")
            .send({ token: { $ne: "" }, newPassword: "attacker-pass" });

        expect(res.status).toBe(400);

        // The victim's password must be unchanged
        const saved = await User.findById(victim._id).select("+password");
        expect(await saved.matchPassword(password)).toBe(true);
    });
});

describe("GET /api/auth/me (JWT guard)", () => {
    it("returns the logged-in user with a valid token", async () => {
        const { user, token } = await createUser();

        const res = await request(app).get("/api/auth/me").set("Authorization", bearer(token));

        expect(res.status).toBe(200);
        expect(res.body.user.username).toBe(user.username);
    });

    it("rejects a missing token", async () => {
        const res = await request(app).get("/api/auth/me");
        expect(res.status).toBe(401);
    });

    it("rejects a tampered token", async () => {
        const { token } = await createUser();

        const res = await request(app)
            .get("/api/auth/me")
            .set("Authorization", bearer(token.slice(0, -2) + "xx"));

        expect(res.status).toBe(401);
    });
});
