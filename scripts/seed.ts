// scripts/seed.ts
import dns from "node:dns";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Force public DNS to avoid ISP/Windows SRV query failures
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

// Direct import of model schemas to avoid Next.js-specific globals
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

const SportSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    isActive: { type: Boolean, default: true },
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

  // ─── Create 3 Starter Sports ──────────────────────────────────────
  const sports = [
    { name: "Cricket", slug: "cricket" },
    { name: "Football", slug: "football" },
    { name: "Kabaddi", slug: "kabaddi" },
  ];

  for (const sport of sports) {
    await Sport.create(sport);
    console.log(`✅ Sport created: ${sport.name}`);
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
