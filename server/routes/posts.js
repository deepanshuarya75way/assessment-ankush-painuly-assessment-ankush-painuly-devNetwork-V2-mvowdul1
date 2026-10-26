import express from "express";
import { protect } from "../middlewares/auth.js";
import { uploadPostImage } from "../config/cloudinary.js";
import {
  createPost,
  getFeed,
  getSavedPosts,
  getUserPosts,
  getPost,
  reactToPost,
  addComment,
  deleteComment,
  deletePost,
  savePost,
  repost,
} from "../controllers/postController.js";

const postRouter = express.Router();

// ─── SPECIFIC ROUTES FIRST ────────────────────────────────
postRouter.get("/feed",         protect, getFeed);
postRouter.get("/saved",        protect, getSavedPosts);
postRouter.get("/user/:userId", protect, getUserPosts);

// ─── CRUD ─────────────────────────────────────────────────
postRouter.post("/",            protect, uploadPostImage.single("image"), createPost);
postRouter.get("/:postId",      protect, getPost);
postRouter.delete("/:postId",   protect, deletePost);

// ─── ACTIONS ──────────────────────────────────────────────
postRouter.patch("/:postId/react",                protect, reactToPost);
postRouter.patch("/:postId/save",                 protect, savePost);
postRouter.post("/:postId/comment",               protect, addComment);
postRouter.delete("/:postId/comment/:commentId",  protect, deleteComment);
postRouter.post("/:postId/repost",                protect, repost);

export default postRouter;