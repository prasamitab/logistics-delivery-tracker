const mongoose = require("mongoose");

const scanEventSchema = new mongoose.Schema(
  {
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
    },
    trackingId: { type: String, required: true },
    status: { type: String, required: true },
    locationName: { type: String },
    coordinates: {
      lat: Number,
      lng: Number,
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    remarks: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScanEvent", scanEventSchema);
