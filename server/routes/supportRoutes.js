const express = require("express");
const SupportTicket = require("../models/SupportTicket");
const Shipment = require("../models/Shipment");

const router = express.Router();

// CREATE SUPPORT TICKET
router.post("/create", async (req, res) => {
  try {
    const {
      trackingId,
      createdBy,
      issueType,
      description,
      priority,
    } = req.body;

    if (!trackingId || !createdBy || !issueType || !description) {
      return res.status(400).json({
        success: false,
        message: "trackingId, createdBy, issueType and description are required",
      });
    }

    const shipment = await Shipment.findOne({ trackingId });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    const ticketId = `TKT-${Date.now()}`;

    const ticket = await SupportTicket.create({
      ticketId,
      trackingId,
      shipment: shipment._id,
      createdBy,
      issueType,
      description,
      priority: priority || "MEDIUM",
      status: "OPEN",
    });

    shipment.supportStatus = "OPEN";
    await shipment.save();

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticket,
    });
  } catch (error) {
    console.error("Create support ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create support ticket",
      error: error.message,
    });
  }
});

// GET ALL TICKETS FOR A USER
router.get("/user/:userId", async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ createdBy: req.params.userId })
      .populate("shipment", "trackingId currentStatus payment supportStatus")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Get user tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user tickets",
      error: error.message,
    });
  }
});

// GET SINGLE TICKET
router.get("/:ticketId", async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId })
      .populate("shipment", "trackingId currentStatus payment supportStatus")
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Get single ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
      error: error.message,
    });
  }
});

// GET ALL TICKETS (ADMIN/SUPPORT)
router.get("/", async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate("shipment", "trackingId currentStatus payment supportStatus")
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Get all tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all tickets",
      error: error.message,
    });
  }
});

// UPDATE TICKET STATUS / ASSIGN / ADD REMARK
router.put("/:ticketId", async (req, res) => {
  try {
    const { status, assignedTo, remark } = req.body;

    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (status) {
      ticket.status = status;
    }

    if (assignedTo) {
      ticket.assignedTo = assignedTo;
    }

    if (remark) {
      ticket.adminRemarks.push({ message: remark });
    }

    await ticket.save();

    const shipment = await Shipment.findById(ticket.shipment);

    if (shipment) {
      if (ticket.status === "OPEN" || ticket.status === "IN_REVIEW") {
        shipment.supportStatus = "OPEN";
      } else if (ticket.status === "INVESTIGATING" || ticket.status === "ESCALATED") {
        shipment.supportStatus = "INVESTIGATING";
      } else if (ticket.status === "RESOLVED") {
        shipment.supportStatus = "RESOLVED";
      } else if (ticket.status === "CLOSED") {
        shipment.supportStatus = "CLOSED";
      }

      await shipment.save();
    }

    const updatedTicket = await SupportTicket.findOne({ ticketId: req.params.ticketId })
      .populate("shipment", "trackingId currentStatus payment supportStatus")
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role");

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Update ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update ticket",
      error: error.message,
    });
  }
});

// DELETE TICKET (OPTIONAL)
router.delete("/:ticketId", async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    await SupportTicket.deleteOne({ _id: ticket._id });

    const remainingOpenTickets = await SupportTicket.find({
      shipment: ticket.shipment,
      status: { $in: ["OPEN", "IN_REVIEW", "INVESTIGATING", "ESCALATED"] },
    });

    const shipment = await Shipment.findById(ticket.shipment);
    if (shipment && remainingOpenTickets.length === 0) {
      shipment.supportStatus = "NONE";
      await shipment.save();
    }

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Delete ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete ticket",
      error: error.message,
    });
  }
});

module.exports = router;