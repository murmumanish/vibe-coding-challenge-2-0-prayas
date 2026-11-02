// src/models/Session.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISession extends Document {
  dateKey: string;
  sport: Types.ObjectId;
  status: "open" | "closed";
  closedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  // No updatedAt by design
}

const SessionSchema = new Schema<ISession>(
  {
    dateKey: { type: String, required: true },
    sport: { type: Schema.Types.ObjectId, ref: "Sport", required: true },
    status: {
      type: String,
      required: true,
      enum: ["open", "closed"],
      default: "open",
    },
    closedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Enforces one session per sport per day
SessionSchema.index({ dateKey: 1, sport: 1 }, { unique: true });

const Session: Model<ISession> =
  mongoose.models.Session ||
  mongoose.model<ISession>("Session", SessionSchema);

export default Session;
