const User = require("../models/User");
const Shipment = require("../models/Shipment");
const ShipmentEvent = require("../models/ShipmentEvent");

const getAllDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: "driver" }).select("-password").sort({ createdAt: -1 });

    return res.json({ drivers });
  } catch (err) {
    console.error("Get all drivers error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

const getDriverAssignments = async (req, res) => {
  try {
    const driverId = req.user.id;

    const shipments = await Shipment.find({ assignedDriver: driverId })
      .sort({ createdAt: -1 })
      .populate("assignedDriver", "name email phone vehicleNumber");

    return res.json({ shipments });
  } catch (err) {
    console.error("Get driver assignments error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

const updateShipmentStatus = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { status, locationName, lat, lng, notes } = req.body;

    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    if (
      !shipment.assignedDriver ||
      shipment.assignedDriver.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "You can update only your assigned shipments",
      });
    }

    if (status) {
      shipment.currentStatus = status;
    }

    const hasLat = lat !== undefined && lat !== null && lat !== "";
    const hasLng = lng !== undefined && lng !== null && lng !== "";

    // Parse numeric coordinates safely
    const parsedLat = hasLat ? parseFloat(lat) : null;
    const parsedLng = hasLng ? parseFloat(lng) : null;

    if ((hasLat || hasLng) &&
        (Number.isNaN(parsedLat) || Number.isNaN(parsedLng))) {
      return res.status(400).json({
        message: "Latitude and longitude must be valid numbers (e.g. 17.57, 78.44)",
      });
    }

    if (parsedLat !== null && parsedLng !== null) {
      shipment.currentLocation = {
        lat: parsedLat,
        lng: parsedLng,
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
      status: status || shipment.currentStatus,
      locationName: locationName || shipment.currentLocation?.label || "",
      notes: notes || "",
      updatedBy: req.user.id,
    });

    const updatedShipment = await Shipment.findById(shipment._id).populate(
      "assignedDriver",
      "name email phone vehicleNumber"
    );

    return res.json({
      message: "Shipment status updated successfully",
      shipment: updatedShipment,
      event,
    });
  } catch (err) {
    console.error("Update shipment status error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

module.exports = {
  getAllDrivers,
  getDriverAssignments,
  updateShipmentStatus,
};