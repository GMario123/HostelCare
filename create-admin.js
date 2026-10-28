
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    const name = process.env.ADMIN_NAME?.trim();
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error(
        "Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env"
      );
    }

    if (password.length < 8 || password.length > 72) {
      throw new Error("Admin password must be 8–72 characters.");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const existing = await User.findOne({ email });

    if (existing) {
      console.log(
        `An account with ${email} already exists (role: ${existing.role}). No changes made.`
      );
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      roomNumber: ""
    });

    console.log("Admin account created successfully!");
    console.log("Admin email:", email);
    console.log("Login page: http://localhost:3000/admin-login.html");
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

createAdmin();
