// src/models/Attendance.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAttendance extends Document {
  session: Types.ObjectId;
  player: Types.ObjectId;
  status: "present" | "absent";
  markedBy?: Types.ObjectId;
  createdAt: Date;
  // No updatedAt by design
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    player: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["present", "absent"],
      default: "absent",
    },
    markedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Stops double marking
AttendanceSchema.index({ session: 1, player: 1 }, { unique: true });

const Attendance: Model<IAttendance> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>("Attendance", AttendanceSchema);

export default Attendance;
