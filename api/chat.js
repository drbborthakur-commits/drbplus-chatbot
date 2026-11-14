import { systemPrompt } from "../config/clinic.js";

// Model and instructions live here on the server, so nobody can misuse your API key.
const MODEL = process.env.AI_MODEL || "claude-haiku-5-5";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages = [], lang = "en" } = req.body || {};
    // keep the last 16 turns, text only, max 2000 chars each, must start with the user
    let clean = messages
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .slice(-16)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
    while (clean.length && clean[0].role !== "user") clean.shift();
    if (!clean.length) return res.status(400).json({ error: "No message" });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 700, system: systemPrompt(lang), messages: clean }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: data?.error?.message || "AI error" });
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: "Failed to connect to AI" });
  }
}
