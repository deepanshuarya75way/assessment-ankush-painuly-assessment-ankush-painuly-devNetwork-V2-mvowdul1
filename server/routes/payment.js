import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  createPayment,
  paymentWebhook,
  verifyPremium,
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

paymentRouter.post("/create", protect, createPayment);
paymentRouter.post("/webhook", paymentWebhook);
paymentRouter.get("/premium/verify", protect, verifyPremium);

export default paymentRouter;
