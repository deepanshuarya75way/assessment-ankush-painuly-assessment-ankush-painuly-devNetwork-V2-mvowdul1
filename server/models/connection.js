// models/Connection.js
import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    // who sent the request
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // who received the request
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// PREVENT DUPLICATE REQUESTS using compound index to increse efficency for search 
connectionSchema.index({ sender: 1, receiver: 1 }, { unique: true });

export default mongoose.model("Connection", connectionSchema);
