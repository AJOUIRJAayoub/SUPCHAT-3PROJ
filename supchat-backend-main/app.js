// Load environment variables from .env file
require("dotenv").config();

// Core dependencies
const express = require("express");
require("./db/index"); // Initialize database connection
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const compression = require("compression");

// Realtime communication
const { Server } = require("socket.io");

// Application routes and utilities
const { PATHS } = require("./constants/route.constants");
const routes = require("./routes/index");
const { receiveMessage } = require("./utils/helpingFunctions");

// Create Express application instance
const app = express();

// Port configuration
const PORT = process.env.PORT || 5000;

// Global middleware setup
app.use(helmet());
app.use(
  cors({
    origin: "*",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: [],
  })
);
app.use(compression()); // Enable gzip compression

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is healthy",
    environment: process.env.NODE_ENV,
  });
});

app.use(PATHS, routes);

// Middleware
app.use(express.json());

// Basic route to verify the server is running
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL, // your frontend URL
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  // eslint-disable-next-line no-console
  console.log("User connected:", socket.id);

  socket.on("setup", async (userId) => {
    // Placeholder for persisting socket.id in database
    socket.join(userId); // User joins personal room
    // eslint-disable-next-line no-console
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });
  socket.on("userRemoved", async ({ adminId }) => {
    io.to(adminId).emit("userRemoved", {
      message: "You have been removed from the group",
    });
  });

  socket.on(
    "message",
    async ({ sender, receiverId, chat, content, seenBy, imageUrl }) => {
      const populatedMessage = await receiveMessage({
        sender,
        chat,
        content,
        seenBy,
        imageUrl,
      });
      // Emit message to the intended recipient(s)
      console.log("receiver id", receiverId);
      if (Array.isArray(receiverId)) {
        receiverId.forEach((id) => {
          io.to(id).emit("receive-message", populatedMessage);
        });
      } else {
        io.to(receiverId).emit("receive-message", populatedMessage);
      }
    }
  );
  socket.on("disconnect", () => {
    // eslint-disable-next-line no-console
    console.log("User disconnected:", socket.id);
    // Optional: update user status in the database
  });
});
