// ============================================================
// utils/aiClient.js — Shared Anthropic (Claude) client
//
// The AI writing assistant is OPTIONAL: it only switches on when
// ANTHROPIC_API_KEY is set in backend/.env. The key stays on the
// server — the browser never sees it.
//
// Kept in its own file so tests can replace it with a fake.
// ============================================================

const { Anthropic } = require("@anthropic-ai/sdk");

let client = null;

const isAiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

// Create the client once, on first use
const getAiClient = () => {
    if (!client) client = new Anthropic(); // Reads ANTHROPIC_API_KEY from the environment
    return client;
};

module.exports = { isAiEnabled, getAiClient };
