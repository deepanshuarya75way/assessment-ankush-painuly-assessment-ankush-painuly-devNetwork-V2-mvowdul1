import express from "express";
import {signup,verifyOTP,resendOTP,login, logout, getMe, forgotPassword, resetPassword, googleCallback} from "../controllers/authController.js";
import { protect } from "../middlewares/auth.js";
import passport from "passport";

const authRouter = express.Router();

authRouter.post("/signup",signup);
authRouter.post("/verify-otp",verifyOTP);
authRouter.post("/resend-otp",resendOTP);
authRouter.post("/login",login);

authRouter.post("/logout",protect,logout)
authRouter.get("/me",protect, getMe);

authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password",  resetPassword);

// Redirect to Google
authRouter.get("/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google redirects back here
authRouter.get("/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`,
  }),
  googleCallback
);

export default authRouter;