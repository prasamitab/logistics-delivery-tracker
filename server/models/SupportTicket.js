const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    trackingId: {
      type: String,
      required: true,
      index: true,
    },
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    issueType: {
      type: String,
      enum: ["MISSING", "DELAYED", "DAMAGED", "WRONG_DELIVERY", "PAYMENT", "OTHER"],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_REVIEW", "INVESTIGATING", "RESOLVED", "ESCALATED", "CLOSED"],
      default: "OPEN",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adminRemarks: [
      {
        message: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);