import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (error) {
    console.log("Error connecting to database:", error);
    throw error;
  }
}

export default connectDB;