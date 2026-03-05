// backend/models/Chunk.js ✅ FULL UPDATED (adds vector index hint + safer schema)
const mongoose = require("mongoose");

const ChunkSchema = new mongoose.Schema(
  {
    botId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bot",
      index: true,
      required: true,
    },
    sourceType: { type: String, enum: ["website", "pdf"], required: true },
    source: { type: String, required: true }, // url or filename
    meta: { type: Object, default: {} }, // { url, title, file }
    text: { type: String, required: true },
    embedding: { type: [Number], required: true }, // vector
  },
  { timestamps: true }
);

// Optional helpful indexes
ChunkSchema.index({ botId: 1, sourceType: 1 });

module.exports = mongoose.model("Chunk", ChunkSchema);