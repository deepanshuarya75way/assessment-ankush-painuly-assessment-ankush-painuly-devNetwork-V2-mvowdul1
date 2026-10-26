import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  getChatList,
  getOrCreateChat,
} from "../controllers/chatController.js";

const chatRouter = express.Router();

chatRouter.get("/list", protect, getChatList);
chatRouter.get("/:userId", protect, getOrCreateChat);

export default chatRouter;
