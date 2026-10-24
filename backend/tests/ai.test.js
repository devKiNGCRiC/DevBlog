// ============================================================
// tests/ai.test.js — AI writing assistant (Claude client is faked)
// ============================================================

// Replace the real Claude client — tests must never make paid API calls
const mockCreate = jest.fn();
jest.mock("../utils/aiClient", () => ({
    isAiEnabled: () => Boolean(process.env.ANTHROPIC_API_KEY),
    getAiClient: () => ({ beta: { messages: { create: mockCreate } } }),
}));

const request = require("supertest");
const app = require("../app");
const { connectTestDB, clearTestDB, closeTestDB, createUser, bearer } = require("./helpers");

beforeAll(connectTestDB);
afterEach(async () => {
    await clearTestDB();
    mockCreate.mockReset();
    delete process.env.ANTHROPIC_API_KEY;
});
afterAll(closeTestDB);

const longContent = `<p>${"React hooks let function components manage state and side effects. ".repeat(10)}</p>`;

const suggest = (token, body) =>
    request(app).post("/api/ai/suggest").set("Authorization", bearer(token)).send(body);

describe("AI assistant", () => {
    it("reports itself disabled, and refuses to run, without an API key", async () => {
        const { token } = await createUser();

        const status = await request(app).get("/api/ai/status").set("Authorization", bearer(token));
        const res = await suggest(token, { title: "Hooks", content: longContent });

        expect(status.body.enabled).toBe(false);
        expect(res.status).toBe(503);
        expect(mockCreate).not.toHaveBeenCalled();
    });

    it("returns cleaned-up suggestions from Claude's JSON answer", async () => {
        process.env.ANTHROPIC_API_KEY = "test-key";
        const { token } = await createUser();
        mockCreate.mockResolvedValue({
            stop_reason: "end_turn",
            content: [{
                type: "text",
                text: JSON.stringify({
                    excerpt: "A practical tour of React hooks.",
                    tags: ["React", "hooks", "react", " state-management "],
                    titles: ["Hooks, Explained", "Thinking in Hooks", "State Without Classes"],
                }),
            }],
        });

        const res = await suggest(token, { title: "Hooks", content: longContent });

        expect(res.status).toBe(200);
        expect(res.body.excerpt).toBe("A practical tour of React hooks.");
        expect(res.body.tags).toEqual(["react", "hooks", "state-management"]);
        expect(res.body.titles).toHaveLength(3);

        // Claude gets plain text (no HTML) and a JSON schema for its answer
        const params = mockCreate.mock.calls[0][0];
        expect(params.model).toBe("claude-opus-5-5");
        expect(params.messages[0].content).not.toContain("<p>");
        expect(params.output_config.format.type).toBe("json_schema");
    });

    it("rejects drafts that are too short to summarise", async () => {
        process.env.ANTHROPIC_API_KEY = "test-key";
        const { token } = await createUser();

        const res = await suggest(token, { title: "Hi", content: "<p>Too short</p>" });

        expect(res.status).toBe(400);
        expect(mockCreate).not.toHaveBeenCalled();
    });

    it("handles a refusal without crashing", async () => {
        process.env.ANTHROPIC_API_KEY = "test-key";
        const { token } = await createUser();
        mockCreate.mockResolvedValue({ stop_reason: "refusal", content: [] });

        const res = await suggest(token, { title: "Hooks", content: longContent });
        expect(res.status).toBe(422);
    });

    it("requires login", async () => {
        const res = await request(app).post("/api/ai/suggest").send({ content: longContent });
        expect(res.status).toBe(401);
    });
});
