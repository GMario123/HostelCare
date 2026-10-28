
const mongoose = require("mongoose");
const crypto = require("crypto");

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    studentName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60
    },

    roomNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 15
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Electrical",
        "Plumbing / Water",
        "Wi-Fi / Internet",
        "Room Cleaning",
        "Furniture",
        "Other"
      ]
    },

    priority: {
      type: String,
      required: true,
      enum: ["Low", "Medium", "High"]
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending"
    }
  },
  {
    timestamps: true
  }
);

complaintSchema.pre("validate", function () {
  if (!this.complaintId) {
    this.complaintId =
      "HC-" + crypto.randomUUID().slice(0, 8).toUpperCase();
  }
});

module.exports = mongoose.model("Complaint", complaintSchema);
