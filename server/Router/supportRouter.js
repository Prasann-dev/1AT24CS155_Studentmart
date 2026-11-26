const express = require("express");
const router = express.Router();
const SupportTicket = require("../Models/SupportTicket");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

const VALID_TICKET_STATUSES = ["Open", "In Review", "Resolved"];

// POST: Public Contact Us inquiry (no login required, routes to Admin Support Tickets)
router.post("/contact", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !name.trim() || !email || !email.trim() || !subject || !subject.trim() || !message || !message.trim()) {
            return res.status(400).json({ message: "Name, email, subject, and message are required." });
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email.trim())) {
            return res.status(400).json({ message: "Please provide a valid email address." });
        }

        const ticket = await SupportTicket.create({
            userEmail: email.trim().toLowerCase(),
            userName: name.trim(),
            source: "contact",
            subject: subject.trim(),
            category: "Other",
            message: message.trim()
        });

        res.status(201).json({
            message: "Thank you for contacting StudentMart! Our campus desk will reply via email.",
            ticket
        });
    } catch (error) {
        console.error("Contact inquiry error:", error);
        res.status(500).json({ message: "Failed to send message", error: error.message });
    }
});

// GET: Fetch current user's support tickets
router.get("/my-tickets", verifyToken, async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        console.error("Fetch support tickets error:", error);
        res.status(500).json({ message: "Failed to fetch support tickets", error: error.message });
    }
});

// POST: Submit a new support ticket
router.post("/", verifyToken, async (req, res) => {
    try {
        const { subject, category, orderId, message } = req.body;

        if (!subject || !subject.trim() || !message || !message.trim()) {
            return res.status(400).json({ message: "Subject and message are required." });
        }

        const ticket = await SupportTicket.create({
            user: req.user.id,
            userEmail: req.user.email,
            userName: req.user.name || "Student",
            subject: subject.trim(),
            category: category || "Other",
            orderId: (orderId || "").trim(),
            message: message.trim()
        });

        res.status(201).json({
            message: "Support ticket submitted successfully",
            ticket
        });
    } catch (error) {
        console.error("Create support ticket error:", error);
        res.status(500).json({ message: "Failed to submit support ticket", error: error.message });
    }
});

// GET: Admin - Fetch all support tickets with filters & summary stats
router.get("/admin/all", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { status, category, search } = req.query;
        const query = {};

        if (status && status !== "All") {
            query.status = status;
        }
        if (category && category !== "All") {
            query.category = category;
        }
        if (search && search.trim()) {
            const regex = { $regex: search.trim(), $options: "i" };
            query.$or = [
                { subject: regex },
                { message: regex },
                { userName: regex },
                { userEmail: regex },
                { orderId: regex }
            ];
        }

        const [tickets, allTickets] = await Promise.all([
            SupportTicket.find(query).sort({ createdAt: -1 }),
            SupportTicket.find().select("status")
        ]);

        const stats = {
            total: allTickets.length,
            open: allTickets.filter((t) => t.status === "Open").length,
            inReview: allTickets.filter((t) => t.status === "In Review").length,
            resolved: allTickets.filter((t) => t.status === "Resolved").length
        };

        res.json({ tickets, stats });
    } catch (error) {
        console.error("Admin fetch support tickets error:", error);
        res.status(500).json({ message: "Failed to fetch support tickets", error: error.message });
    }
});

// PUT: Admin - Update ticket status and/or post reply
router.put("/admin/:id/status", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { status, adminReply } = req.body;
        if (!status || !VALID_TICKET_STATUSES.includes(status)) {
            return res.status(400).json({ message: "Invalid ticket status." });
        }

        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: "Support ticket not found." });
        }

        ticket.status = status;
        if (adminReply !== undefined) {
            ticket.adminReply = String(adminReply).trim();
        }
        ticket.updatedBy = req.user.name || req.user.email || "Administrator";
        if (status === "Resolved") {
            ticket.resolvedAt = new Date();
        }

        const updated = await ticket.save();
        res.json({ message: "Support ticket updated", ticket: updated });
    } catch (error) {
        console.error("Admin update support ticket error:", error);
        res.status(500).json({ message: "Failed to update support ticket", error: error.message });
    }
});

module.exports = router;
