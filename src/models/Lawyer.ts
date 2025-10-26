// src/models/Lawyer.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILawyer extends Document {
  name: string;
  telephone: string;
  email: string;
  city: string;
  picture?: string;        // profile picture URL (optional)
  licenseNumber: string;   // license / registration number (required)
  licenseImage?: string;   // scanned license image URL (optional)
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LawyerSchema: Schema<ILawyer> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    telephone: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    city: { type: String, required: true, trim: true },

    // URLs (store where you upload images - Cloudinary/S3 etc.)
    picture: { type: String, default: null },

    // License fields
    licenseNumber: { type: String, required: true, trim: true },
    licenseImage: { type: String, default: null },

    // Verification (admin toggles this)
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent model overwrite in dev/hot reload
const Lawyer: Model<ILawyer> =
  (mongoose.models && (mongoose.models.Lawyer as Model<ILawyer>)) ||
  mongoose.model<ILawyer>("Lawyer", LawyerSchema);

export default Lawyer;
