import dotenv from "dotenv";
dotenv.config();
import http from "http";
import cors from "cors"
import express from "express";
import connectDB from "./config/database.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.js";
import connectionRouter from "./routes/connection.js";
import postRouter from "./routes/posts.js";
import userRouter from "./routes/user.js";
import chatRouter from "./routes/chat.js";
import paymentRouter from "./routes/payment.js";
import { createSocketServer } from "./socket.js";

import "./config/passport.js";
import passport from "passport";


const app = express();
app.set('trust proxy', 1);

const httpServer = http.createServer(app);
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(cookieParser());
  
app.use(cors({
  origin:process.env.CLIENT_URL,
  credentials:true,
}));


app.use(passport.initialize());

app.use("/api/auth",authRouter);
app.use("/api/connections", connectionRouter);
app.use("/api/posts", postRouter);
app.use("/api/users", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/payments", paymentRouter);

createSocketServer(httpServer);

const PORT = process.env.PORT || 8080;

connectDB()
  .then(() => {
    console.log("Database Connect Successfully!!");

    httpServer.listen(PORT, () => {
      console.log("server is listining on ", PORT);
    });
  })
  .catch((err) => {
    console.log("Databse cannot be connected ");
  });
