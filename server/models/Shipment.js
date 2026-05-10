const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
  {
    trackingId: { type: String, required: true, unique: true },
    barcodeValue: { type: String, required: true },

    senderName: { type: String, required: true },
    senderPhone: { type: String, required: true },
    senderEmail: { type: String, default: "", trim: true, lowercase: true },

    receiverName: { type: String, required: true },
    receiverPhone: { type: String, required: true },
    receiverEmail: { type: String, default: "", trim: true, lowercase: true },

    origin: { type: String, required: true },
    destination: { type: String, required: true },

    pickupAddress: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    bookingNotes: { type: String, default: "" },

    parcelType: { type: String },
    weight: { type: Number },

    currentStatus: {
      type: String,
      enum: [
        "Booked",
        "Driver Assigned",
        "Picked Up",
        "At Origin Hub",
        "In Transit",
        "At Destination Hub",
        "Out for Delivery",
        "Delivered",
        "Delivery Failed",
      ],
      default: "Booked",
    },

    currentLocation: {
      lat: Number,
      lng: Number,
      label: String,
    },

    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    payment: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
      method: {
        type: String,
        enum: ["PREPAID", "COD"],
        default: "PREPAID",
      },
      status: {
        type: String,
        enum: [
          "PENDING",
          "PAID",
          "FAILED",
          "COD_PENDING",
          "COD_COLLECTED",
          "REFUNDED",
        ],
        default: "PENDING",
      },
      razorpayOrderId: { type: String, default: "" },
      razorpayPaymentId: { type: String, default: "" },
      razorpaySignature: { type: String, default: "" },
      paidAt: { type: Date, default: null },
    },

    supportStatus: {
      type: String,
      enum: ["NONE", "OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"],
      default: "NONE",
    },

    estimatedDeliveryDate: Date,
    deliveredAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shipment", shipmentSchema);