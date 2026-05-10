const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Shipment = require("../models/Shipment");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post("/create-order/:shipmentId", async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { amount, method } = req.body;

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    if (method === "COD") {
      shipment.payment.amount = Number(amount) || shipment.payment.amount || 0;
      shipment.payment.method = "COD";
      shipment.payment.status = "COD_PENDING";
      await shipment.save();

      return res.status(200).json({
        success: true,
        message: "COD selected successfully",
        shipment,
      });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    const options = {
      amount: Number(amount) * 100,
      currency: "INR",
      receipt: `receipt_${shipment.trackingId}_${Date.now()}`,
      notes: {
        trackingId: shipment.trackingId,
        shipmentId: shipment._id.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    shipment.payment.amount = Number(amount);
    shipment.payment.currency = "INR";
    shipment.payment.method = "PREPAID";
    shipment.payment.status = "PENDING";
    shipment.payment.razorpayOrderId = order.id;
    await shipment.save();

    return res.status(200).json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      order,
      trackingId: shipment.trackingId,
    });
  } catch (error) {
    console.error("Create payment order error:", error);
    return res.status(500).json({
      message: "Failed to create payment order",
      error: error.message,
    });
  }
});

router.post("/verify/:shipmentId", async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    shipment.payment.status = "PAID";
    shipment.payment.razorpayOrderId = razorpay_order_id;
    shipment.payment.razorpayPaymentId = razorpay_payment_id;
    shipment.payment.razorpaySignature = razorpay_signature;
    shipment.payment.paidAt = new Date();

    await shipment.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      shipment,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({
      message: "Payment verification failed",
      error: error.message,
    });
  }
});

module.exports = router;