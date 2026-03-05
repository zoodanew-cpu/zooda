// backend/routes/bot.js (CommonJS) ✅ FULL UPDATED
const express = require("express");
const multer = require("multer");
const Bot = require("../models/Bot");
const { ingestBot } = require("../services/ingest");

const router = express.Router();

// -----------------------------
// Multer: accept ONLY PDFs, max 2 (✅ memoryStorage so file.buffer works)
// -----------------------------
const upload = multer({
  storage: multer.memoryStorage(), // ✅ IMPORTANT (pdf-parse needs buffer)
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB each
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype === "application/pdf" ||
      String(file.originalname || "").toLowerCase().endsWith(".pdf");
    if (!ok) return cb(new Error("Only PDF files are allowed"));
    cb(null, true);
  },
});

// -----------------------------
// Helpers
// -----------------------------
function isValidHttpUrl(value) {
  try {
    const u = new URL(String(value || "").trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// -----------------------------
// POST /api/bot/setup
// Creates a bot + starts ingestion
// -----------------------------
router.post("/bot/setup", upload.array("pdfs", 2), async (req, res) => {
  try {
    const businessName = String(req.body.businessName || "").trim();
    const websiteUrl = String(req.body.websiteUrl || "").trim();

    if (!businessName || !websiteUrl) {
      return res.status(400).json({
        success: false,
        message: "businessName and websiteUrl are required",
      });
    }

    if (!isValidHttpUrl(websiteUrl)) {
      return res.status(400).json({
        success: false,
        message: "Invalid websiteUrl. Use https://yourwebsite.com",
      });
    }

    // ✅ DEBUG LOG FIRST
    console.log("FILES:", (req.files || []).map((f) => ({
      name: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      hasBuffer: !!f.buffer,
      bufferLen: f.buffer?.length || 0,
    })));

    const bot = await Bot.create({
      businessName,
      websiteUrl,
      status: "processing",
      error: "",
      pagesCrawled: 0,
      chunksCount: 0,
      lastIngest: null,
      lastPdfError: "",
    });

    // ✅ run ingestion async (non-blocking)
    ingestBot(bot._id, { websiteUrl: bot.websiteUrl, pdfFiles: req.files || [] })
      .catch((e) => console.error("Ingest error:", e?.message || e));

    return res.json({
      success: true,
      botId: bot._id,
      status: bot.status,
    });
  } catch (err) {
    const msg =
      err?.message?.includes("Only PDF files are allowed")
        ? "Only PDF files are allowed"
        : err.message || "Server error";

    return res.status(500).json({ success: false, message: msg });
  }
});

// -----------------------------
// POST /api/bot/:botId/reingest
// Rebuild knowledge base after user updates website/pdfs
// -----------------------------
router.post("/bot/:botId/reingest", upload.array("pdfs", 2), async (req, res) => {
  try {
    const botId = req.params.botId;

    const bot = await Bot.findById(botId);
    if (!bot) return res.status(404).json({ success: false, message: "Bot not found" });

    const websiteUrl = String(req.body.websiteUrl || bot.websiteUrl || "").trim();
    if (!isValidHttpUrl(websiteUrl)) {
      return res.status(400).json({
        success: false,
        message: "Invalid websiteUrl. Use https://yourwebsite.com",
      });
    }

    bot.websiteUrl = websiteUrl;
    bot.status = "processing";
    bot.error = "";
    bot.pagesCrawled = 0;
    bot.chunksCount = 0;
    bot.lastIngest = null;
    bot.lastPdfError = "";
    await bot.save();

    ingestBot(bot._id, { websiteUrl: bot.websiteUrl, pdfFiles: req.files || [] }).catch((e) => {
      console.error("Reingest error:", e?.message || e);
    });

    return res.json({ success: true, botId: bot._id, status: "processing" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// -----------------------------
// GET /api/bot/:botId/status
// Frontend polling endpoint
// -----------------------------
router.get("/bot/:botId/status", async (req, res) => {
  try {
    const bot = await Bot.findById(req.params.botId).lean();
    if (!bot) return res.status(404).json({ success: false, message: "Bot not found" });

    return res.json({
      success: true,
      bot: {
        _id: bot._id,
        businessName: bot.businessName,
        websiteUrl: bot.websiteUrl,
        status: bot.status,
        error: bot.error || "",
        pagesCrawled: bot.pagesCrawled || 0,
        chunksCount: bot.chunksCount || 0,
        lastIngest: bot.lastIngest || null,
        lastPdfError: bot.lastPdfError || "",
        updatedAt: bot.updatedAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

module.exports = router;