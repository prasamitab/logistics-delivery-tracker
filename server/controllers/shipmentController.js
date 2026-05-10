const Shipment = require("../models/Shipment");
const ShipmentEvent = require("../models/ShipmentEvent");
const { sendMilestoneNotifications } = require("../utils/notificationService");

function estimateDeliveryDateFromStatus(status) {
  const hoursByStatus = {
    "Booked": 48,
    "Driver Assigned": 36,
    "Picked Up": 30,
    "At Origin Hub": 24,
    "In Transit": 18,
    "At Destination Hub": 8,
    "Out for Delivery": 3,
    "Delivered": 0,
    "Delivery Failed": 0,
  };

  const hours = hoursByStatus[status] ?? 24;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function generateTrackingId() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `LDT${Date.now()}${random}`;
}

const triggerMilestoneNotifications = async (shipment) => {
  try {
    if (!shipment?.currentStatus) return;

    if (shipment.currentStatus === "Picked Up") {
      await sendMilestoneNotifications(shipment, "Picked Up");
    }

    if (shipment.currentStatus === "Out for Delivery") {
      await sendMilestoneNotifications(shipment, "Out for Delivery");
    }

    if (shipment.currentStatus === "Delivered") {
      await sendMilestoneNotifications(shipment, "Delivered");
    }
  } catch (err) {
    console.error("Milestone notification error:", err.message);
  }
};

const createShipment = async (req, res) => {
  try {
    const {
      senderName,
      senderPhone,
      senderEmail,
      receiverName,
      receiverPhone,
      receiverEmail,
      origin,
      destination,
      pickupAddress,
      deliveryAddress,
      parcelType,
      weight,
      estimatedDeliveryDate,
      driverId,
    } = req.body;

    if (
      !senderName ||
      !senderPhone ||
      !receiverName ||
      !receiverPhone ||
      !origin ||
      !destination ||
      !pickupAddress ||
      !deliveryAddress
    ) {
      return res.status(400).json({
        message: "Please fill all required shipment fields",
      });
    }

    let trackingId = generateTrackingId();
    let existing = await Shipment.findOne({ trackingId });

    while (existing) {
      trackingId = generateTrackingId();
      existing = await Shipment.findOne({ trackingId });
    }

    const barcodeValue = trackingId;
    const initialStatus = driverId ? "Driver Assigned" : "Booked";

    const shipment = await Shipment.create({
      trackingId,
      barcodeValue,
      senderName,
      senderPhone,
      senderEmail: senderEmail || "",
      receiverName,
      receiverPhone,
      receiverEmail: receiverEmail || "",
      origin,
      destination,
      pickupAddress,
      deliveryAddress,
      parcelType: parcelType || "",
      weight: weight ? parseFloat(weight) : 0,
      estimatedDeliveryDate:
        estimatedDeliveryDate || estimateDeliveryDateFromStatus(initialStatus),
      assignedDriver: driverId || null,
      currentStatus: initialStatus,
      currentLocation: {
        lat: null,
        lng: null,
        label: origin || "",
      },
    });

    await ShipmentEvent.create({
      shipment: shipment._id,
      trackingId: shipment.trackingId,
      status: initialStatus,
      locationName: origin,
      scannedBy: req.user?._id || null,
      source: "shipment-created",
    });

    const populatedShipment = await Shipment.findById(shipment._id).populate(
      "assignedDriver",
      "name email phone vehicleNumber"
    );

    return res.status(201).json({
      message: "Shipment created successfully",
      shipment: populatedShipment,
    });
  } catch (err) {
    console.error("Create shipment error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

const getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find()
      .sort({ createdAt: -1 })
      .populate("assignedDriver", "name email phone vehicleNumber");

    return res.json({ shipments });
  } catch (err) {
    console.error("Get all shipments error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

const getShipmentByTrackingId = async (req, res) => {
  try {
    const { trackingId } = req.params;

    if (!trackingId || !trackingId.trim()) {
      return res.status(400).json({
        message: "Tracking ID is required",
      });
    }

    const shipment = await Shipment.findOne({
      trackingId: trackingId.trim(),
    }).populate("assignedDriver", "name email phone vehicleNumber");

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    const events = await ShipmentEvent.find({
      shipment: shipment._id,
    })
      .sort({ createdAt: -1 })
      .populate("scannedBy", "name role");

    return res.json({
      shipment,
      events,
    });
  } catch (err) {
    console.error("Get shipment by trackingId error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

const assignDriver = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({
        message: "Driver ID is required",
      });
    }

    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    shipment.assignedDriver = driverId;
    shipment.currentStatus = "Driver Assigned";
    shipment.estimatedDeliveryDate = estimateDeliveryDateFromStatus(
      shipment.currentStatus
    );

    await shipment.save();

    await ShipmentEvent.create({
      shipment: shipment._id,
      trackingId: shipment.trackingId,
      status: "Driver Assigned",
      locationName: shipment.currentLocation?.label || shipment.origin || "",
      scannedBy: req.user?._id || null,
      source: "driver-assigned",
    });

    const updatedShipment = await Shipment.findById(shipment._id).populate(
      "assignedDriver",
      "name email phone vehicleNumber"
    );

    return res.json({
      message: "Driver assigned successfully",
      shipment: updatedShipment,
    });
  } catch (err) {
    console.error("Assign driver error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

const getDriverAssignments = async (req, res) => {
  try {
    const driverId = req.user.id;

    const shipments = await Shipment.find({
      assignedDriver: driverId,
    })
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
    const { status, locationName, lat, lng } = req.body;

    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    if (status) {
      shipment.currentStatus = status;
      shipment.estimatedDeliveryDate = estimateDeliveryDateFromStatus(
        shipment.currentStatus
      );
    }

    const hasLat = lat !== undefined && lat !== null && lat !== "";
    const hasLng = lng !== undefined && lng !== null && lng !== "";

    if (hasLat && hasLng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);

      if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
        return res.status(400).json({
          message: "Latitude and longitude must be valid numbers",
        });
      }

      shipment.currentLocation = {
        lat: parsedLat,
        lng: parsedLng,
        label: locationName || shipment.currentLocation?.label || "",
      };
    } else if (locationName) {
      shipment.currentLocation = {
        lat: shipment.currentLocation?.lat ?? null,
        lng: shipment.currentLocation?.lng ?? null,
        label: locationName,
      };
    }

    if (shipment.currentStatus === "Delivered") {
      shipment.deliveredAt = new Date();
    }

    await shipment.save();
    await triggerMilestoneNotifications(shipment);

    await ShipmentEvent.create({
      shipment: shipment._id,
      trackingId: shipment.trackingId,
      status: shipment.currentStatus,
      locationName: locationName || shipment.currentLocation?.label || "",
      scannedBy: req.user?._id || null,
      source: "status-update",
    });

    const updatedShipment = await Shipment.findById(shipment._id).populate(
      "assignedDriver",
      "name email phone vehicleNumber"
    );

    const events = await ShipmentEvent.find({
      shipment: shipment._id,
    })
      .sort({ createdAt: -1 })
      .populate("scannedBy", "name role");

    return res.json({
      message: "Shipment updated successfully",
      shipment: updatedShipment,
      events,
    });
  } catch (err) {
    console.error("Update shipment status error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

const createCustomerBooking = async (req, res) => {
  try {
    const {
      senderName,
      senderPhone,
      senderEmail,
      receiverName,
      receiverPhone,
      receiverEmail,
      origin,
      destination,
      parcelType,
      weight,
      pickupAddress,
      deliveryAddress,
      notes,
    } = req.body;

    if (
      !senderName ||
      !senderPhone ||
      !receiverName ||
      !receiverPhone ||
      !origin ||
      !destination ||
      !pickupAddress ||
      !deliveryAddress ||
      !weight
    ) {
      return res.status(400).json({
        message: "Please fill all required booking fields",
      });
    }

    let trackingId = generateTrackingId();
    let existing = await Shipment.findOne({ trackingId });

    while (existing) {
      trackingId = generateTrackingId();
      existing = await Shipment.findOne({ trackingId });
    }

    const barcodeValue = trackingId;

    const shipment = await Shipment.create({
      trackingId,
      barcodeValue,
      senderName,
      senderPhone,
      senderEmail: senderEmail || "",
      receiverName,
      receiverPhone,
      receiverEmail: receiverEmail || "",
      origin,
      destination,
      parcelType: parcelType || "Document",
      weight: parseFloat(weight),
      pickupAddress,
      deliveryAddress,
      bookingNotes: notes || "",
      currentStatus: "Booked",
      estimatedDeliveryDate: estimateDeliveryDateFromStatus("Booked"),
      assignedDriver: null,
      currentLocation: {
        lat: null,
        lng: null,
        label: origin,
      },
    });

    await ShipmentEvent.create({
      shipment: shipment._id,
      trackingId: shipment.trackingId,
      status: "Booked",
      locationName: origin,
      scannedBy: req.user?._id || null,
      source: "customer-booking",
    });

    return res.status(201).json({
      message: "Shipment booked successfully",
      shipment,
    });
  } catch (err) {
    console.error("Create customer booking error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

const ingestScanEvent = async (req, res) => {
  try {
    const { trackingId, status, locationName, lat, lng } = req.body;

    if (!trackingId || !trackingId.trim()) {
      return res.status(400).json({
        message: "Tracking ID is required",
      });
    }

    if (!status || !status.trim()) {
      return res.status(400).json({
        message: "Status is required",
      });
    }

    const shipment = await Shipment.findOne({
      trackingId: trackingId.trim(),
    });

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    const event = await ShipmentEvent.create({
      shipment: shipment._id,
      trackingId: shipment.trackingId,
      status: status.trim(),
      locationName: locationName || "",
      location: {
        lat: lat ?? null,
        lng: lng ?? null,
      },
      scannedBy: req.user?._id || null,
      source: "barcode-scan",
    });

    shipment.currentStatus = status.trim();
    shipment.estimatedDeliveryDate = estimateDeliveryDateFromStatus(
      shipment.currentStatus
    );
    shipment.currentLocation = {
      label: locationName || shipment.currentLocation?.label || "",
      lat: lat ?? shipment.currentLocation?.lat ?? null,
      lng: lng ?? shipment.currentLocation?.lng ?? null,
    };

    if (shipment.currentStatus === "Delivered") {
      shipment.deliveredAt = new Date();
    }

    await shipment.save();
    await triggerMilestoneNotifications(shipment);

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

const getCustomerShipments = async (req, res) => {
  try {
    const userEmail = req.user.email?.trim().toLowerCase();

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "User email not found in token",
      });
    }

    const shipments = await Shipment.find({
      $or: [{ senderEmail: userEmail }, { receiverEmail: userEmail }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const formattedShipments = shipments.map((shipment) => ({
      ...shipment,
      isSender: shipment.senderEmail?.trim().toLowerCase() === userEmail,
      isReceiver: shipment.receiverEmail?.trim().toLowerCase() === userEmail,
    }));

    return res.status(200).json({
      success: true,
      shipments: formattedShipments,
    });
  } catch (err) {
    console.error("Get customer shipments error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer shipments",
    });
  }
};

module.exports = {
  createCustomerBooking,
  getShipmentByTrackingId,
  getAllShipments,
  createShipment,
  assignDriver,
  getDriverAssignments,
  updateShipmentStatus,
  ingestScanEvent,
  getCustomerShipments,
};