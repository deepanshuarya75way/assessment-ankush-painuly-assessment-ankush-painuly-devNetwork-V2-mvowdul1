// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protect = async (req, res, next) => {
  try {

    // ─── GET TOKEN FROM COOKIE ─────────────────────────────
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please login.",
      });
    }

    // ─── VERIFY TOKEN ─────────────────────────────────────
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded → { id: "64f1a2b3...", iat: ..., exp: ... }

    // ─── FIND USER ────────────────────────────────────────
    const user = await User.findById(decoded.id).select("-password -otp -otpExpiry -lastOtpSentAt");//not sending password, otp, otpExpiry, lastOtpSentAt to the client

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    // ─── ATTACH USER TO REQUEST ───────────────────────────
    req.user = user;
    next(); // ← move to the actual route handler

  } catch (err) {

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please login again.",
      });
    }

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ─── PREMIUM MIDDLEWARE ───────────────────────────────────
export const isPremium = (req, res, next) => {
  const plan = req.user.subscription.plan;

  if (plan === "pro" || plan === "elite") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "This feature requires a Pro or Elite plan.",
  });
};

