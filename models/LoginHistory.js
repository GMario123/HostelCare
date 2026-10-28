
const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      required: true
    },
    loginAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoginHistory", loginHistorySchema);
