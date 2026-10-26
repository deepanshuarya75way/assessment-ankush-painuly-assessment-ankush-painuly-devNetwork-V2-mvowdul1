// models/Post.js
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    // ─── AUTHOR ───────────────────────────────────────────
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── CONTENT ──────────────────────────────────────────
    content: {
      type: String,
      required: false, // optional
      default: "",
      maxlength: 3000,
    },

    // ─── MEDIA ────────────────────────────────────────────
    image: {
      type: String,
      default: "",
    },

    // ─── CODE SNIPPET ─────────────────────────────────────
    codeSnippet: {
      code:     { type: String },
      language: { type: String, default: "javascript" },
    },

    // ─── TAGS ─────────────────────────────────────────────
    tags: [{ type: String }], // ["react", "nodejs", "javascript"]

    // ─── REACTIONS ────────────────────────────────────────
    // array of userIds who reacted
    reactions: {
      fire:        [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      insightful:  [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      nicework:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      interesting: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },

    // ─── COMMENTS ─────────────────────────────────────────
    comments: [commentSchema],

    // ─── REPOST ───────────────────────────────────────────
    repostOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null, // null means original post
    },
    reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // ─── SAVED ────────────────────────────────────────────
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // ─── VISIBILITY ───────────────────────────────────────
    visibility: {
      type: String,
      enum: ["public", "connections"],
      default: "public",
    },
  },
  { timestamps: true }
);

// ─── INDEXES FOR BETTER PERFORMANCE ───────────────────────
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ tags: 1 });

export default mongoose.model("Post", postSchema);
