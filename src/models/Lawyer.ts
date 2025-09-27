import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILawyer extends Document {
  name: string;
  telephone: string;
  email: string;
  city: string;
  picture?: string;
  license: string;
  verified: boolean;
}

const LawyerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    telephone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    city: { type: String, required: true },
    picture: { type: String }, // URL to picture
    license: { type: String, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Lawyer: Model<ILawyer> =
  mongoose.models.Lawyer || mongoose.model<ILawyer>("Lawyer", LawyerSchema);

export default Lawyer;
