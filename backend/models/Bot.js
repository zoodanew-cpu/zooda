// backend/models/Bot.js ✅ FULL UPDATED (adds lastIngest + lastPdfError)
const mongoose = require("mongoose");

const BotSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true },
    websiteUrl: { type: String, required: true },

    status: {
      type: String,
      enum: ["idle", "processing", "ready", "error"],
      default: "idle",
    },
    error: { type: String, default: "" },

    pagesCrawled: { type: Number, default: 0 },
    chunksCount: { type: Number, default: 0 },

    // ✅ progress for UI
    lastIngest: { type: Object, default: null }, // { type, current, total, file? }
    lastPdfError: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bot", BotSchema);