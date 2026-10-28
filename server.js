
require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");

const complaintsRouter = require("./routes/complaints");
const authRouter = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(
  session({
    name: "hostelcare.sid",
    secret:
      process.env.SESSION_SECRET ||
      "change-this-secret-before-use",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60
    }
  })
);

// Authentication API
app.use("/api/auth", authRouter);

// Complaint APIs
app.use("/api/complaints", complaintsRouter);

// Frontend
app.use(express.static(path.join(__dirname, "public")));

// Backend health check
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "HostelCare backend is working!"
  });
});

// Connect to MongoDB and start server
async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is missing in the .env file."
    );
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    family: 4
  });

  console.log("MongoDB connected successfully!");

  app.listen(PORT, () => {
    console.log(
      `HostelCare running at http://localhost:${PORT}`
    );
  });
}

startServer().catch((error) => {
  console.error("Startup failed:", error.message);

  const servers = error.reason?.servers;

  if (servers) {
    for (const [address, server] of servers) {
      console.error(
        address,
        server.error?.message ||
          server.error?.name ||
          server.type
      );
    }
  }

  process.exit(1);
});
