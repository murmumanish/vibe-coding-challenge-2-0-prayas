// src/models/MatchScore.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IMatchScore extends Document {
  match: Types.ObjectId;
  player: Types.ObjectId;
  primaryScore: number;
  stats?: Record<string, unknown>;
  createdBy: Types.ObjectId;
  createdAt: Date;
  // No updatedAt by design
}

const MatchScoreSchema = new Schema<IMatchScore>(
  {
    match: { type: Schema.Types.ObjectId, ref: "Match", required: true },
    player: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    primaryScore: { type: Number, required: true, min: 0 },
    stats: { type: Schema.Types.Mixed },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Prevents duplicate score for same player and match
MatchScoreSchema.index({ match: 1, player: 1 }, { unique: true });
// Plain index for Ready calculation
MatchScoreSchema.index({ player: 1 });

const MatchScore: Model<IMatchScore> =
  mongoose.models.MatchScore ||
  mongoose.model<IMatchScore>("MatchScore", MatchScoreSchema);

export default MatchScore;
