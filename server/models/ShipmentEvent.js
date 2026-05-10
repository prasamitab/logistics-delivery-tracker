const mongoose = require("mongoose");

const shipmentEventSchema = new mongoose.Schema(
  {
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
    },
    trackingId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      trim: true,
    },
    locationName: {
      type: String,
      default: "",
      trim: true,
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    source: {
      type: String,
      default: "barcode-scan",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShipmentEvent", shipmentEventSchema);