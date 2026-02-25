import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import habitRoutes from "./routes/habitRoutes.js";
import motivationRoutes from "./routes/motivationRoutes.js";
import streakRestoreRoutes from "./routes/streakRestoreRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import circleRoutes from "./routes/circleRoutes.js";
import mapRoutes from "./routes/mapRoutes.js";

const app = express();
const server = http.createServer(app);

/* =========================
   ✅ SOCKET.IO SETUP
========================= */

export const io = new Server(server, {
  cors: {
    origin: [
      "https://streakmate.vercel.app",
      "http://localhost:5173",
      "http://localhost:5175",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

/* =========================
   ✅ CORS CONFIGURATION
========================= */

app.use(
  cors({
    origin: [
      "https://streakmate.vercel.app",
      "http://localhost:5173",
      "http://localhost:5175",
    ],
    credentials: true,
  })
);

app.use(express.json());

/* =========================
   ✅ MONGODB CONNECTION
========================= */

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

connectDB();

/* =========================
   ✅ ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/motivation", motivationRoutes);
app.use("/api/streak-restore", streakRestoreRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/circles", circleRoutes);
app.use("/api/map", mapRoutes);

/* =========================
   ✅ HEALTH CHECK
========================= */

app.get("/", (req, res) => {
  res.send("API is running ✅");
});

/* =========================
   ✅ START SERVER (RENDER)
========================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});