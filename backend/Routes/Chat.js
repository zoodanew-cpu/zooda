// backend/routes/chat.js (fixed)
const express = require("express");
const Bot = require("../models/Bot");
const Chunk = require("../models/Chunk");
const ChatMessage = require("../models/ChatMessage");
const { embedText, cosineSim } = require("../lib/embeddings");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
const MIN_SCORE = Number(process.env.CHAT_MIN_SCORE || 0.30);

// POST /api/chat – send message and get AI response (saves history)
router.post("/", authMiddleware, async (req, res) => {
  try {
    // ✅ Check if user is attached (defensive)
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { botId, question, businessId } = req.body;
    // ✅ Use _id, not id
    const userId = req.user._id;

    if (!botId || !question || !businessId) {
      return res.status(400).json({
        success: false,
        message: "botId, question, and businessId are required"
      });
    }

    // Save user message
    const userMessage = new ChatMessage({
      user: userId,
      business: businessId,
      role: "user",
      text: question,
    });
    await userMessage.save();

    // Fetch bot
    const bot = await Bot.findById(botId).lean();
    if (!bot) {
      const aiMessage = new ChatMessage({
        user: userId,
        business: businessId,
        role: "ai",
        text: "Bot not found."
      });
      await aiMessage.save();
      return res.status(404).json({ success: false, message: "Bot not found" });
    }

    // Helper to send answer and save AI message
    const sendAnswer = async (answer, sources = []) => {
      const aiMessage = new ChatMessage({
        user: userId,
        business: businessId,
        role: "ai",
        text: answer,
      });
      await aiMessage.save();
      return res.json({ success: true, answer, sources });
    };

    // Bot status checks (unchanged) ...
    if (bot.status === "ready" && (bot.chunksCount || 0) === 0) {
      return sendAnswer(
        "Your bot is marked ready, but no content was extracted (0 chunks). Please re-ingest with a valid website and/or PDFs.",
        []
      );
    }

    if (bot.status !== "ready") {
      const answer = bot.status === "error"
        ? `Knowledge base error: ${bot.error || "Unknown error"}`
        : "Your knowledge base is still processing. Please try again in a moment.";
      return sendAnswer(answer, []);
    }

    // Embed question
    const qVec = await embedText(question);

    // Fetch chunks
    const candidates = await Chunk.find({ botId })
      .select("text sourceType source meta embedding")
      .lean();

    if (!candidates.length) {
      return sendAnswer(
        "No knowledge is available yet. Please add your website and PDFs, then wait for processing to finish.",
        []
      );
    }

    // Score and rank
    const scored = candidates
      .map((c) => ({ ...c, score: cosineSim(qVec, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const best = scored[0];
    if (!best || best.score < MIN_SCORE) {
      return sendAnswer(
        "I couldn’t find this information in your uploaded PDFs or website content. Please upload a relevant document or add this information to your website.",
        []
      );
    }

    const take = scored.filter((s) => s.score >= MIN_SCORE).slice(0, 3);
    const answer = take.map((x) => x.text).join("\n\n");

    const sources = scored.map((s) => ({
      type: s.sourceType,
      source: s.source,
      meta: s.meta,
      score: Number(s.score.toFixed(3)),
      snippet: s.text.slice(0, 220) + (s.text.length > 220 ? "…" : ""),
    }));

    return sendAnswer(answer, sources);
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// GET /api/chat/history – retrieve conversation history
router.get("/history", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { businessId } = req.query;
    const userId = req.user._id;

    if (!businessId) {
      return res.status(400).json({ success: false, message: "businessId is required" });
    }

    const messages = await ChatMessage.find({ user: userId, business: businessId })
      .sort({ timestamp: 1 })
      .select("role text timestamp -_id");

    res.json({ success: true, messages });
  } catch (err) {
    console.error("History fetch error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;