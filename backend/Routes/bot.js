const express = require("express");
const multer = require("multer");
const Bot = require("../models/Bot");
const Business = require("../models/Business");
const { ingestBot } = require("../services/ingest");

const router = express.Router();

// Multer config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype === "application/pdf" ||
      String(file.originalname || "").toLowerCase().endsWith(".pdf");
    if (!ok) return cb(new Error("Only PDF files are allowed"));
    cb(null, true);
  },
});

function isValidHttpUrl(value) {
  try {
    const u = new URL(String(value || "").trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// POST /api/bot/setup
router.post("/bot/setup", upload.array("pdfs", 2), async (req, res) => {
  try {
    const businessId = String(req.body.businessId || "").trim();
    const businessName = String(req.body.businessName || "").trim();
    const websiteUrl = String(req.body.websiteUrl || "").trim();

    if (!businessId || !businessName || !websiteUrl) {
      return res.status(400).json({
        success: false,
        message: "businessId, businessName and websiteUrl are required",
      });
    }

    if (!isValidHttpUrl(websiteUrl)) {
      return res.status(400).json({
        success: false,
        message: "Invalid websiteUrl. Use https://yourwebsite.com",
      });
    }

    // (Optional) Verify that the business exists and belongs to the logged-in user
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: "Business not found" });
    }
    // If you have user authentication, you can check:
    // if (business.userId.toString() !== req.user.id) {
    //   return res.status(403).json({ success: false, message: "Unauthorized" });
    // }

    const bot = await Bot.create({
      businessId,
      businessName,
      websiteUrl,
      status: "processing",
      error: "",
      pagesCrawled: 0,
      chunksCount: 0,
      lastIngest: null,
      lastPdfError: "",
    });

    // Update the Business document with the new botId
    await Business.findByIdAndUpdate(businessId, { botId: bot._id });

    // Start ingestion asynchronously
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

// POST /api/bot/:botId/reingest
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

// GET /api/bot/:botId/status
router.get("/bot/:botId/status", async (req, res) => {
  try {
    const bot = await Bot.findById(req.params.botId).lean();
    if (!bot) return res.status(404).json({ success: false, message: "Bot not found" });

    return res.json({
      success: true,
      bot: {
        _id: bot._id,
        businessId: bot.businessId,
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