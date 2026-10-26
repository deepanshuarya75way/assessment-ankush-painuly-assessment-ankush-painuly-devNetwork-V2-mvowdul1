import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false, // ✅ never returned in normal queries
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 300,
    },
    headline: {
      type: String,
      default: "", // e.g. "Full Stack Developer | React & Node"
      trim: true,
    },
    location: {
      type: String,
      default: "",
    },

    // ─── SOCIAL LINKS ─────────────────────────────────────
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    website: { type: String, default: "" },

    // ─── DEVELOPER INFO ───────────────────────────────────
    skills: [
      {
        type: String,
      },
    ],
    techStack: [
      {
        type: String,
      },
    ],
    availability: {
      type: String,
      enum: ["open_to_work", "open_to_collaborate", "busy", "just_exploring"],
      default: "just_exploring",
    },

    // ─── EXPERIENCE (optional) ────────────────────────────
    experience: [
      {
        title: { type: String },
        company: { type: String },
        from: { type: Date },
        to: { type: Date },
        current: { type: Boolean, default: false },
        description: { type: String },
      },
    ],

    // ─── PROJECTS (optional) ──────────────────────────────
    projects: [
      {
        title: { type: String },
        description: { type: String },
        techStack: [{ type: String }],
        githubLink: { type: String },
        liveLink: { type: String },
        image: { type: String },
      },
    ],

    // ─── AUTH ─────────────────────────────────────────────
    authProvider: {
      type: String,
      enum: ["local", "google", "both"],
      default: "local",
    },
    googleId: {
      type: String,
    },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },
    lastOtpSentAt: { type: Date },

    // ─── SOCIAL GRAPH ─────────────────────────────────────
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // ─── ONLINE STATUS ────────────────────────────────────
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date },

    // ─── SAFETY ───────────────────────────────────────────
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // ─── SUBSCRIPTION ─────────────────────────────────────
    subscription: {
      plan: {
        type: String,
        enum: ["free", "pro", "elite"],
        default: "free",
      },
      startDate: { type: Date },
      endDate: { type: Date },
      razorpaySubscriptionId: { type: String },
    },

    // ─── PROFILE COMPLETION ───────────────────────────────
    profileCompletion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ─── HASH PASSWORD BEFORE SAVE ────────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// ─── MATCH PASSWORD (used in login) ───────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── GENERATE JWT TOKEN ───────────────────────────────────
userSchema.methods.getJWT = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ─── CALCULATE PROFILE COMPLETION % ──────────────────────
userSchema.methods.calcProfileCompletion = function () {
  let score = 0;
  if (this.name) score += 10;
  if (this.avatar) score += 10;
  if (this.bio) score += 15;
  if (this.headline) score += 10;
  if (this.skills?.length) score += 15;
  if (this.techStack?.length) score += 10;
  if (this.github) score += 10;
  if (this.location) score += 5;
  if (this.projects?.length) score += 15;
  this.profileCompletion = score;
  return score;
};

export default mongoose.model("User", userSchema);
