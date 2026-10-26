import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// ─── CONFIGURE CLOUDINARY ─────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── AVATAR STORAGE ───────────────────────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:            "devnetwork/avatars",
    allowed_formats:   ["jpg", "jpeg", "png", "webp"],
    transformation:    [{ width: 400, height: 400, crop: "fill" }],
  },
});

// ─── POST IMAGE STORAGE ───────────────────────────────────
const postImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "devnetwork/posts",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
  },
});

// ─── MULTER INSTANCES ─────────────────────────────────────
export const uploadAvatar    = multer({ storage: avatarStorage });
export const uploadPostImage = multer({ storage: postImageStorage });
