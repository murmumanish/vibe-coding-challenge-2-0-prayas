// src/models/Player.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPlayer extends Document {
  name: string;
  age: number;
  sport: Types.ObjectId;
  userId?: Types.ObjectId;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 5, max: 60 },
    sport: { type: Schema.Types.ObjectId, ref: "Sport", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PlayerSchema.index({ sport: 1, isActive: 1 });

const Player: Model<IPlayer> =
  mongoose.models.Player || mongoose.model<IPlayer>("Player", PlayerSchema);

export default Player;
