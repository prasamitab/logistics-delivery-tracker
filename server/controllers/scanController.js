const Shipment = require("../models/Shipment");
const ShipmentEvent = require("../models/ShipmentEvent");

const createScanEvent = async (req, res) => {
  try {
    const { trackingId, status, locationName, lat, lng, notes } = req.body;

    if (!trackingId || !status) {
      return res.status(400).json({
        message: "trackingId and status are required",
      });
    }

    const shipment = await Shipment.findOne({ trackingId: trackingId.trim() });

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    shipment.currentStatus = status;

    const hasLat = lat !== undefined && lat !== null && lat !== "";
    const hasLng = lng !== undefined && lng !== null && lng !== "";

    if (hasLat && hasLng) {
      shipment.currentLocation = {
        lat: Number(lat),
        lng: Number(lng),
        label: locationName || shipment.currentLocation?.label || "",
        updatedAt: new Date(),
      };
    } else if (locationName) {
      shipment.currentLocation = {
        lat: shipment.currentLocation?.lat ?? null,
        lng: shipment.currentLocation?.lng ?? null,
        label: locationName,
        updatedAt: new Date(),
      };
    }

    await shipment.save();

    const event = await ShipmentEvent.create({
      shipment: shipment._id,
      trackingId: shipment.trackingId,
      status,
      locationName: locationName || "",
      location: {
        lat: lat ?? null,
        lng: lng ?? null,
      },
      scannedBy: req.user?._id || null,
      source: "barcode-scan",
    });
    
    return res.status(201).json({
      message: "Scan event created successfully",
      shipment,
      event,
    });
  } catch (err) {
    console.error("Create scan event error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

const getShipmentScans = async (req, res) => {
  try {
    const { trackingId } = req.params;

    const shipment = await Shipment.findOne({ trackingId: trackingId.trim() });

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    const scans = await ShipmentEvent.find({ shipment: shipment._id })
      .sort({ createdAt: -1 })
      .populate("updatedBy", "name role");

    return res.json({ scans });
  } catch (err) {
    console.error("Get shipment scans error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

module.exports = {
  createScanEvent,
  getShipmentScans,
};