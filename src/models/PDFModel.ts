import mongoose from "mongoose";

const PDFSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  numPages: { type: Number, required: true },
  size: { type: Number },
  uploadedAt: { type: Date, default: Date.now },
  metadata: { type: Object },
});

export default mongoose.models.PDF || mongoose.model("PDF", PDFSchema);
