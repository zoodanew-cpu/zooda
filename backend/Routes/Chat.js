// backend/routes/chat.js (CommonJS) ✅ FULL UPDATED (better answer + no false "no knowledge")
const express = require("express");
const Bot = require("../models/Bot");
const Chunk = require("../models/Chunk");
const { embedText, cosineSim } = require("../lib/embeddings");

const router = express.Router();

const MIN_SCORE = Number(process.env.CHAT_MIN_SCORE || 0.30); // ✅ better default

router.post("/chat", async (req, res) => {
  try {
    const { botId, question } = req.body;

    if (!botId || !question) {
      return res
        .status(400)
        .json({ success: false, message: "botId and question are required" });
    }

    const bot = await Bot.findById(botId).lean();
    if (!bot) {
      return res.status(404).json({ success: false, message: "Bot not found" });
    }

    // ✅ If ready but chunksCount 0, show correct reason
    if (bot.status === "ready" && (bot.chunksCount || 0) === 0) {
      return res.json({
        success: true,
        answer:
          "Your bot is marked ready, but no content was extracted (0 chunks). Please re-ingest with a valid website and/or PDFs. If you uploaded PDFs, check the server logs for PDF parsing issues.",
        sources: [],
      });
    }

    if (bot.status !== "ready") {
      return res.json({
        success: true,
        answer:
          bot.status === "error"
            ? `Knowledge base error: ${bot.error || "Unknown error"}`
            : "Your knowledge base is still processing. Please try again in a moment.",
        sources: [],
      });
    }

    const qVec = await embedText(question);

    // ✅ only fetch needed fields
    const candidates = await Chunk.find({ botId })
      .select("text sourceType source meta embedding")
      .lean();

    if (!candidates.length) {
      return res.json({
        success: true,
        answer:
          "No knowledge is available yet. Please add your website and PDFs, then wait for processing to finish.",
        sources: [],
      });
    }

    const scored = candidates
      .map((c) => ({ ...c, score: cosineSim(qVec, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const best = scored[0];

    if (!best || best.score < MIN_SCORE) {
      return res.json({
        success: true,
        answer:
          "I couldn’t find this information in your uploaded PDFs or website content. Please upload a relevant document or add this information to your website.",
        sources: [],
      });
    }

    // ✅ better answer: combine top 2-3 chunks (more useful than returning only one chunk)
    const take = scored.filter((s) => s.score >= MIN_SCORE).slice(0, 3);
    const answer = take.map((x) => x.text).join("\n\n");

    const sources = scored.map((s) => ({
      type: s.sourceType,
      source: s.source,
      meta: s.meta,
      score: Number(s.score.toFixed(3)),
      snippet: s.text.slice(0, 220) + (s.text.length > 220 ? "…" : ""),
    }));

    return res.json({ success: true, answer, sources });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
});

module.exports = router;