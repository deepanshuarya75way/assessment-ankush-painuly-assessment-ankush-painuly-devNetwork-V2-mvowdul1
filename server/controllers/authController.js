import User from "../models/user.js";
import { generateOTP, getOTPExpiry } from "../utils/generateOtp.js";
import { sendOTPEmail, sendPasswordResetEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};


// @POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
  
    // ─── VALIDATE FIELDS ──────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // ─── CHECK IF EMAIL ALREADY EXISTS ────────────────────
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // ─── GENERATE OTP ─────────────────────────────────────
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();
    
    // ─── CREATE USER ──────────────────────────────────────
    // password will be auto-hashed by pre("save") hook
    const user = await User.create({
      name,
      email,
      password,
      otp,
      otpExpiry,
      lastOtpSentAt: new Date(),
    });
    console.log("check 1")
   
    // ─── SEND OTP EMAIL ───────────────────────────────────
    await sendOTPEmail(email, otp, name);
   

    // ─── RESPONSE ─────────────────────────────────────────
    // Don't send token yet — user must verify OTP first
    res.status(201).json({
      success: true,
      message: "OTP sent to your email. Please verify your account.",
      userId: user._id, // needed on frontend to call verify-otp
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // ─── VALIDATE FIELDS ──────────────────────────────────
    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: "userId and OTP are required",
      });
    }

    // ─── FIND USER ────────────────────────────────────────
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ─── ALREADY VERIFIED ─────────────────────────────────
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Account already verified. Please login.",
      });
    }
    
    // ─── CHECK OTP EXPIRY ─────────────────────────────────
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // ─── CHECK OTP MATCH ──────────────────────────────────
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }


    // ─── MARK USER AS VERIFIED ────────────────────────────
    user.isVerified = true;
    user.otp = undefined; // remove OTP from DB
    user.otpExpiry = undefined; // remove expiry from DB
    user.lastOtpSentAt = undefined; // reset OTP sent time
    user.calcProfileCompletion();
    await user.save();

    // ─── GENERATE TOKEN ───────────────────────────────────
    // Now we give the token — user is fully verified
    const token = user.getJWT();


     // ✅ Cookie with proper security options
     res.cookie("token", token, getCookieOptions())

    // ─── RESPONSE ─────────────────────────────────────────
    res.status(200).json({
      success: true,
      message: "Account verified successfully!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        headline: user.headline,
        isVerified: user.isVerified,
        subscription: user.subscription,
        profileCompletion: user.profileCompletion,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    // ─── VALIDATE ─────────────────────────────────────────
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    // ─── FIND USER ────────────────────────────────────────
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ─── ALREADY VERIFIED ─────────────────────────────────
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Account already verified. Please login.",
      });
    }

    // ─── COOLDOWN CHECK ───────────────────────────────────
    if (user.lastOtpSentAt) {
      const cooldownTime = 60 * 1000; // 60 seconds
      const timePassed = Date.now() - user.lastOtpSentAt.getTime();

      if (timePassed < cooldownTime) {
        const waitSeconds = Math.ceil((cooldownTime - timePassed) / 1000);

        return res.status(429).json({
          success: false,
          message: `Please wait ${waitSeconds} seconds before requesting a new OTP`,
          waitSeconds, // ✅ frontend can use this to show a countdown timer
        });
      }
    }

    // ─── GENERATE NEW OTP ─────────────────────────────────
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    // ─── UPDATE USER ──────────────────────────────────────
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.lastOtpSentAt = new Date();
    await user.save();

    // ─── SEND NEW OTP EMAIL ───────────────────────────────
    await sendOTPEmail(user.email, otp, user.name);

    // ─── RESPONSE ─────────────────────────────────────────
    res.status(200).json({
      success: true,
      message: "New OTP sent to your email.",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // ─── VALIDATE FIELDS ──────────────────────────────────
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }
  
      // ─── FIND USER ────────────────────────────────────────
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid email or password",
        });
      }
  
      // ─── GOOGLE USER TRYING PASSWORD LOGIN ────────────────
      if (user.authProvider === "google") {
        return res.status(400).json({
          success: false,
          message: "This account uses Google login. Please sign in with Google.",
        });
      }
  
      // ─── CHECK IF VERIFIED ────────────────────────────────
      if (!user.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Email not verified. Please verify your account first.",
          userId: user._id,
          needsVerification: true,
        });
      }
  
      // ─── MATCH PASSWORD ───────────────────────────────────
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Invalid email or password",
        });
      }
  
      // ─── GENERATE TOKEN + SET COOKIE ──────────────────────
      const token = user.getJWT();
  
      res.cookie("token", token, getCookieOptions());
  
      // ─── RESPONSE ─────────────────────────────────────────
      res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          _id:               user._id,
          name:              user.name,
          email:             user.email,
          avatar:            user.avatar,
          headline:          user.headline,
          bio:               user.bio,
          skills:            user.skills,
          availability:      user.availability,
          isVerified:        user.isVerified,
          subscription:      user.subscription,
          profileCompletion: user.profileCompletion,
        },
      });
  
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
};


export const logout = async (req, res) => {
    res.cookie("token", "", {
      ...getCookieOptions(),
      expires: new Date(0), // ← sets expiry to past → browser deletes it immediately
    });
  
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
};

export const getMe = async (req, res) => {
    // req.user is already fetched by protect middleware
    // protect already has try/catch
    // here we are just sending the response
    res.status(200).json({
      success: true,
      user: req.user,
    });
};


export const forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
  
      // ─── VALIDATE ─────────────────────────────────────────
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }
  
      // ─── FIND USER ────────────────────────────────────────
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No account found with this email",
        });
      }
  
      // ─── GOOGLE ONLY ACCOUNT ──────────────────────────────
      if (user.authProvider === "google") {
        return res.status(400).json({
          success: false,
          message: "This account uses Google login. No password to reset.",
        });
      }
  
      // ─── COOLDOWN CHECK ───────────────────────────────────
      if (user.lastOtpSentAt) {
        const cooldownTime = 60 * 1000;
        const timePassed = Date.now() - user.lastOtpSentAt.getTime();
  
        if (timePassed < cooldownTime) {
          const waitSeconds = Math.ceil((cooldownTime - timePassed) / 1000);
          return res.status(429).json({
            success: false,
            message: `Please wait ${waitSeconds} seconds before requesting again`,
            waitSeconds,
          });
        }
      }
  
      // ─── GENERATE OTP ─────────────────────────────────────
      const otp = generateOTP();
      const otpExpiry = getOTPExpiry();
  
      user.otp           = otp;
      user.otpExpiry     = otpExpiry;
      user.lastOtpSentAt = new Date();
      await user.save();
  
      // ─── SEND EMAIL ───────────────────────────────────────
      await sendPasswordResetEmail(user.email, otp, user.name);
  
      res.status(200).json({
        success: true,
        message: "Password reset OTP sent to your email",
        userId: user._id, // frontend needs this for reset step
      });
  
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
};

export const resetPassword = async (req, res) => {
    try {
      const { userId, otp, newPassword } = req.body;
  
      // ─── VALIDATE ─────────────────────────────────────────
      if (!userId || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "userId, OTP and new password are required",
        });
      }
  
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }
  
      // ─── FIND USER ────────────────────────────────────────
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      // ─── CHECK EXPIRY FIRST ───────────────────────────────
      if (user.otpExpiry < new Date()) {
        return res.status(400).json({
          success: false,
          message: "OTP has expired. Please request a new one.",
        });
      }
  
      // ─── CHECK OTP MATCH ──────────────────────────────────
      if (user.otp !== otp) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }
  
      // ─── UPDATE PASSWORD ──────────────────────────────────
      user.password      = newPassword; // pre save hook hashes it ✅
      user.otp           = undefined;
      user.otpExpiry     = undefined;
      user.lastOtpSentAt = undefined;
      await user.save();
  
      res.status(200).json({
        success: true,
        message: "Password reset successfully. Please login.",
      });
  
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
};



// controllers/authController.js
//google
export const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    const token = user.getJWT();

    res.cookie("token", token, getCookieOptions())

    // Redirect to frontend
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success`);
  } catch (err) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);

  }
};
