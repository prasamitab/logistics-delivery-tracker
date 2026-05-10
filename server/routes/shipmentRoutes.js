const express = require("express");
const router = express.Router();

const {
  createCustomerBooking,
  getShipmentByTrackingId,
  getAllShipments,
  createShipment,
  assignDriver,
  getDriverAssignments,
  updateShipmentStatus,
  ingestScanEvent,
  getCustomerShipments,
} = require("../controllers/shipmentController");

const {
  protect,
  adminOnly,
  driverOnly,
} = require("../middleware/authMiddleware");

// Public booking endpoint (customer portal creates a shipment booking)
router.post("/customer-booking", createCustomerBooking);

// Driver: view assignments for the logged-in driver
router.get("/driver/me/assignments", protect, driverOnly, getDriverAssignments);

// Admin: list and create shipments
router.get("/", protect, adminOnly, getAllShipments);
router.post("/", protect, adminOnly, createShipment);

// Customer: view shipments associated with the logged-in user
router.get("/customer/my-shipments", protect, getCustomerShipments);

// Scan ingestion from hubs / drivers
router.post("/scan", protect, ingestScanEvent);

// Admin/driver: assign driver and update status
router.put("/:shipmentId/assign-driver", protect, adminOnly, assignDriver);
router.put("/:shipmentId/status", protect, driverOnly, updateShipmentStatus);

// Public: track shipment by tracking ID
router.get("/:trackingId", getShipmentByTrackingId);

module.exports = router;