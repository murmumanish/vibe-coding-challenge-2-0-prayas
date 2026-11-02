// src/models/Sport.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISport extends Document {
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SportSchema = new Schema<ISport>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Sport: Model<ISport> =
  mongoose.models.Sport || mongoose.model<ISport>("Sport", SportSchema);

export default Sport;
