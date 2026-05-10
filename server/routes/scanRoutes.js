const express = require("express");
const router = express.Router();

const { createScanEvent, getShipmentScans } = require("../controllers/scanController");
const { protect, driverOnly, adminOnly } = require("../middleware/authMiddleware");

router.post("/", protect, driverOnly, createScanEvent);
router.get("/:trackingId", protect, adminOnly, getShipmentScans);

module.exports = router;