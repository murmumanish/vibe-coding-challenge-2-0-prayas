// scripts/seed.ts
import dns from "node:dns";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { SPORT_PRESETS } from "../src/domain/sportPresets";

// Force public DNS to avoid ISP/Windows SRV query failures
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  console.error("❌ Please set MONGODB_URI in .env.local");
  process.exit(1);
}

// ─── Inline schemas (avoids importing from src/ which expects Next.js env) ──

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ["coach", "player", "scout"] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ScoreFieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, default: "number" },
    min: { type: Number, default: 0 },
    integer: { type: Boolean, default: true },
    unit: { type: String },
    required: { type: Boolean, default: false },
    isPrimary: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const SportSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    isPreset: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    scoreFields: [ScoreFieldSchema],
  },
  { timestamps: true }
);

async function seed() {
  console.log("🌱 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);

  const User = mongoose.models.User || mongoose.model("User", UserSchema);
  const Sport = mongoose.models.Sport || mongoose.model("Sport", SportSchema);

  // Clear existing data
  await User.deleteMany({});
  await Sport.deleteMany({});

  // ─── Create Coach ─────────────────────────────────────────────────
  const coachPassword = await bcrypt.hash("coach123", 10);
  const coach = await User.create({
    email: "coach@academy.com",
    password: coachPassword,
    name: "Head Coach",
    role: "coach",
  });
  console.log(`✅ Coach created: ${coach.email}`);

  // ─── Create Scout ─────────────────────────────────────────────────
  const scoutPassword = await bcrypt.hash("scout123", 10);
  const scout = await User.create({
    email: "scout@academy.com",
    password: scoutPassword,
    name: "Scout One",
    role: "scout",
  });
  console.log(`✅ Scout created: ${scout.email}`);

  // ─── Create 10 Dumka Academy Sports Presets ───────────────────────
  for (const preset of SPORT_PRESETS) {
    const primaryLabel =
      preset.scoreFields.find((f) => f.isPrimary)?.label || "Score";
    await Sport.create({
      name: preset.name,
      slug: preset.slug,
      scoreFields: preset.scoreFields,
      isPreset: true,
      isActive: true,
    });
    console.log(`✅ Sport created: ${preset.name} (Primary: ${primaryLabel})`);
  }

  console.log("\n🎉 Seed completed successfully!");
  console.log("   Coach login: coach@academy.com / coach123");
  console.log("   Scout login: scout@academy.com / scout123");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
