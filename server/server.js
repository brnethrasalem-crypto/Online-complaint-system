// server.js
// Application entry point — wires up Express, MongoDB, Socket.IO, and middleware.

const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const { Server } = require("socket.io");
const departmentRoutes = require("./routes/departmentRoutes");
dotenv.config();

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { predictComplaintContext } = require("./services/aiService");

// ---- Connect to MongoDB ----
connectDB();

const app = express();

// ---- Global Middleware ----
app.use(helmet()); // Sets secure HTTP headers
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (complaint images/documents) statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---- Global Rate Limiter ----
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// ---- Health Check ----
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

// ---- Routes ----
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);

app.post("/api/ai/predict", async (req, res) => {
  try {
    const result = await predictComplaintContext(req.body || {});
    res.status(200).json({ success: true, prediction: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use("/api/departments", departmentRoutes);
// app.use("/api/officers", officerRoutes);
// app.use("/api/notifications", notificationRoutes);

// ---- Error Handling Middleware (must be last) ----
app.use(notFound);
app.use(errorHandler);

// ---- HTTP Server + Socket.IO Setup ----
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  },
});

// Attach io instance to app so controllers can emit events (e.g. req.app.get('io'))
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on("join", (userId) => {
    if (userId) {
      socket.join(String(userId));
      socket.emit("joined", { userId });
    }
  });

  socket.on("send-message", async (payload) => {
    const { room, senderId, receiverId, message } = payload || {};
    if (!room || !message) return;

    io.to(room).emit("receive-message", {
      room,
      senderId,
      receiverId,
      message,
      sentAt: new Date().toISOString(),
    });
  });

  socket.on("complaint-updated", ({ complaintId, recipientId, payload }) => {
    if (recipientId) {
      io.to(String(recipientId)).emit("notification", {
        type: "complaint-updated",
        complaintId,
        payload,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );
});

// ---- Handle unhandled promise rejections ----
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});