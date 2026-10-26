import express from "express";
import { protect } from "../middlewares/auth.js";
import { uploadAvatar as uploadAvatarMiddleware } from "../config/cloudinary.js";

import {
    getProfile,
    updateProfile,
    uploadAvatar,
    discoverUsers,
    searchUsers,
    getFollowers,
    getFollowing,
    getBlockedUsers,
    followUser,
    blockUser,
    unblockUser,
  } from "../controllers/userController.js";
  
  const userRouter = express.Router();
  
  // ─── SPECIFIC ROUTES FIRST ────────────────────────────────
  userRouter.get("/discover",         protect, discoverUsers);
  userRouter.get("/search",           protect, searchUsers);
  userRouter.get("/blocked/list",     protect, getBlockedUsers);
  userRouter.patch("/update",           protect, updateProfile);
  userRouter.patch("/avatar",           protect, uploadAvatarMiddleware.single("avatar"), uploadAvatar);
  userRouter.get("/:userId/followers", protect, getFollowers);
  userRouter.get("/:userId/following", protect, getFollowing);
  userRouter.post("/:userId/follow",  protect, followUser);
  userRouter.post("/:userId/block",   protect, blockUser);
  userRouter.post("/:userId/unblock", protect, unblockUser);
  userRouter.get("/:userId",          protect, getProfile); // ← dynamic last
  
  export default userRouter;
