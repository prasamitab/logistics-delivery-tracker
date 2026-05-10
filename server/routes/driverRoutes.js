const express = require("express");
const router = express.Router();

const {
  getAllDrivers,
  getDriverAssignments,
  updateShipmentStatus,
} = require("../controllers/driverController");

const { protect, adminOnly, driverOnly } = require("../middleware/authMiddleware");

router.get("/", protect, adminOnly, getAllDrivers);
router.get("/me/assignments", protect, driverOnly, getDriverAssignments);
router.put("/shipments/:shipmentId/status", protect, driverOnly, updateShipmentStatus);

module.exports = router;