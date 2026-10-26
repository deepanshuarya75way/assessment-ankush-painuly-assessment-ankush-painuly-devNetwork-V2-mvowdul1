// config/passport.js
import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.js";

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {

        // ─── CHECK IF GOOGLE USER ALREADY EXISTS ──────────
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user); // existing google user → login ✅

        // ─── CHECK IF EMAIL EXISTS (local account) ────────
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          // link Google to existing local account
          user.googleId = profile.id;

            user.authProvider = "both"; // has password + google now
          

          if (!user.avatar) {
            user.avatar = profile.photos[0].value;
          }

          await user.save();
          user.calcProfileCompletion();
          return done(null, user); // ✅
        }

        // ─── CREATE NEW GOOGLE USER ───────────────────────
        user = new User({
          name:         profile.displayName,
          email:        profile.emails[0].value,
          avatar:       profile.photos[0].value,
          googleId:     profile.id,
          authProvider: "google",
          isVerified:   true, // Google already verified email ✅
        });

        user.calcProfileCompletion();
        await user.save();
        return done(null, user);

      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;