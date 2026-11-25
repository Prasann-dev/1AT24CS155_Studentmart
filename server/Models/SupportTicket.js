const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userEmail: { type: String, required: true },
    userName: { type: String, default: "Student" },
    subject: { type: String, required: true, trim: true },
    category: {
        type: String,
        enum: ["Order Issue", "Delivery", "Payment & Refunds", "Product Inquiry", "Account & Technical", "Other"],
        default: "Other"
    },
    orderId: { type: String, default: "" },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["Open", "In Review", "Resolved"], default: "Open" },
    adminReply: { type: String, default: "", trim: true },
    updatedBy: { type: String, default: "" },
    resolvedAt: Date
}, { timestamps: true });

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
