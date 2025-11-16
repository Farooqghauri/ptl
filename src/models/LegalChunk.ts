// /models/LegalChunk.ts
import mongoose, { Schema, models } from "mongoose";

const LegalChunkSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    source: {
      type: String, // e.g. filename or URL
      required: true,
    },
    uploaderId: {
      type: String, // Clerk user ID (for tracking)
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "legal_chunks",
  }
);

const LegalChunk =
  models.LegalChunk || mongoose.model("LegalChunk", LegalChunkSchema);

export default LegalChunk;
