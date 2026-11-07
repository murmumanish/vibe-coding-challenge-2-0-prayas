// src/models/Match.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IMatch extends Document {
  dateKey: string;
  sport: Types.ObjectId;
  opponent: string;
  location?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    dateKey: { type: String, required: true },
    sport: { type: Schema.Types.ObjectId, ref: "Sport", required: true },
    opponent: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

MatchSchema.index({ dateKey: 1, sport: 1 });
MatchSchema.index({ dateKey: -1, sport: 1 });

const Match: Model<IMatch> =
  mongoose.models.Match || mongoose.model<IMatch>("Match", MatchSchema);

export default Match;
