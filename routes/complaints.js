
const express = require("express");
const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const User = require("../models/User");

const router = express.Router();

const allowedCategories = [
    "Electrical",
    "Plumbing / Water",
    "Wi-Fi / Internet",
    "Room Cleaning",
    "Furniture",
    "Other"
];

const allowedPriorities = ["Low", "Medium", "High"];
const allowedStatuses = ["Pending", "In Progress", "Resolved"];

// Authentication helper
function requireLogin(req, res, next) {
    if (!req.session?.user?.id) {
        return res.status(401).json({
            success: false,
            message: "Please log in first."
        });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (
        !req.session?.user?.id ||
        req.session.user.role !== "admin"
    ) {
        return res.status(403).json({
            success: false,
            message: "Admin access required."
        });
    }
    next();
}

// GET: Students see their own complaints; admins use /admin/all
router.get("/", requireLogin, async (req, res) => {
    try {
        if (req.session.user.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Use the admin complaints endpoint."
            });
        }

        const complaints = await Complaint.find({
            userId: req.session.user.id
        })
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({ success: true, complaints });
    } catch (error) {
        console.error("Fetch complaints error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch complaints."
        });
    }
});

// GET: Track a complaint
router.get("/track/:complaintId", requireLogin, async (req, res) => {
    try {
        const complaintId = String(req.params.complaintId || "")
            .trim()
            .toUpperCase();

        if (!/^HC-[A-F0-9]{8}$/.test(complaintId)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid Complaint ID."
            });
        }

        const filter = { complaintId };

        // Students may track only their own complaints.
        if (req.session.user.role !== "admin") {
            filter.userId = req.session.user.id;
        }

        const complaint = await Complaint.findOne(filter);

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found."
            });
        }

        res.json({ success: true, complaint });
    } catch (error) {
        console.error("Track complaint error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to track complaint right now."
        });
    }
});

// POST: Submit a complaint — students only
router.post("/", requireLogin, async (req, res) => {
    try {
        if (req.session.user.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only students can submit complaints."
            });
        }

        const { roomNumber, category, priority, description } = req.body;

        if (
            typeof roomNumber !== "string" ||
            typeof category !== "string" ||
            typeof priority !== "string" ||
            typeof description !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid complaint details."
            });
        }

        if (
            !roomNumber.trim() ||
            !description.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Required fields cannot be empty."
            });
        }

        if (
            roomNumber.trim().length > 15 ||
            description.trim().length > 1000
        ) {
            return res.status(400).json({
                success: false,
                message: "One or more fields exceed the allowed length."
            });
        }

        if (!allowedCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: "Invalid complaint category."
            });
        }

        if (!allowedPriorities.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: "Invalid priority."
            });
        }

        const user = await User.findById(req.session.user.id);

        if (!user || user.role !== "student") {
            return res.status(401).json({
                success: false,
                message: "Student account not found. Please log in again."
            });
        }

        const complaint = await Complaint.create({
            userId: user._id,
            studentName: user.name,
            roomNumber: roomNumber.trim(),
            category,
            priority,
            description: description.trim()
        });

        res.status(201).json({
            success: true,
            message: "Complaint submitted successfully.",
            complaint
        });
    } catch (error) {
        console.error("Submit complaint error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to submit complaint."
        });
    }
});

// ADMIN: View all complaints
router.get("/admin/all", requireAdmin, async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .sort({ createdAt: -1 })
            .limit(200);

        res.json({ success: true, complaints });
    } catch (error) {
        console.error("Admin fetch error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch complaints."
        });
    }
});

// ADMIN: Update complaint status
router.patch("/:id/status", requireAdmin, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid complaint ID."
            });
        }

        const { status } = req.body;

        if (
            typeof status !== "string" ||
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid complaint status."
            });
        }

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { $set: { status } },
            { new: true, runValidators: true }
        );

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found."
            });
        }

        res.json({
            success: true,
            message: "Complaint status updated successfully.",
            complaint
        });
    } catch (error) {
        console.error("Status update error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update complaint status."
        });
    }
});

module.exports = router;
