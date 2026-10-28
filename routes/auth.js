
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const LoginHistory = require("../models/LoginHistory");

const router = express.Router();

/* Student self-registration */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, roomNumber } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof roomNumber !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !roomNumber.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields."
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must be 8–72 characters long."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      roomNumber: roomNumber.trim(),
      role: "student"
    });

    return res.status(201).json({
      success: true,
      message: "Student account created successfully. You can now log in."
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create account. Please try again."
    });
  }
});

/* Student and Admin login */
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password ||
      !["student", "admin"].includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid login details."
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      role
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    // Create a fresh session after successful authentication.
    req.session.regenerate(async (sessionError) => {
      if (sessionError) {
        console.error("Session error:", sessionError);
        return res.status(500).json({
          success: false,
          message: "Unable to log in. Please try again."
        });
      }

      req.session.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      };

      req.session.save(async (saveError) => {
        if (saveError) {
          console.error("Session save error:", saveError);
          return res.status(500).json({
            success: false,
            message: "Unable to log in. Please try again."
          });
        }

        // Record the successful login in MongoDB.
        try {
          await LoginHistory.create({
            userId: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            loginAt: new Date()
          });
        } catch (historyError) {
          // Keep login working, but report the logging failure.
          console.error("Login history save error:", historyError);
        }

        return res.json({
          success: true,
          message: "Login successful.",
          role: user.role
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in. Please try again."
    });
  }
});

/* Check current session */
router.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Not logged in."
    });
  }

  return res.json({
    success: true,
    user: req.session.user
  });
});

/* Admin-only: view successful login history */
router.get("/login-history", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required."
      });
    }

    const history = await LoginHistory.find({})
      .select("userId name email role loginAt")
      .sort({ loginAt: -1 })
      .limit(500)
      .lean();

    return res.json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    console.error("Login history fetch error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load login history."
    });
  }
});

/* Logout */
router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: "Unable to log out."
      });
    }

    // Must match the cookie name configured in server.js.
    res.clearCookie("hostelcare.sid");
    return res.json({
      success: true,
      message: "Logged out successfully."
    });
  });
});

module.exports = router;
