import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5001/api";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const existingScript = document.getElementById("razorpay-checkout-script");
    if (existingScript) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PaymentSection({ shipment, onRefresh }) {
  const [amount, setAmount] = useState(shipment?.payment?.amount || 100);
  const [method, setMethod] = useState(shipment?.payment?.method || "PREPAID");
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      if (method === "COD") {
        await axios.post(`${API_BASE}/payments/create-order/${shipment._id}`, {
          amount,
          method: "COD",
        });

        alert("COD option selected successfully");
        onRefresh && onRefresh();
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay SDK failed to load");
        return;
      }

      const { data } = await axios.post(
        `${API_BASE}/payments/create-order/${shipment._id}`,
        {
          amount,
          method: "PREPAID",
        }
      );

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "LogistiX Tracker",
        description: `Payment for shipment ${data.trackingId}`,
        order_id: data.order.id,
        handler: async function (response) {
          try {
            await axios.post(`${API_BASE}/payments/verify/${shipment._id}`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            alert("Payment successful");
            onRefresh && onRefresh();
          } catch (error) {
            console.error(error);
            alert("Payment verification failed");
          }
        },
        prefill: {
          name: shipment.receiverName,
          email: shipment.receiverEmail || "",
          contact: shipment.receiverPhone || "",
        },
        notes: {
          trackingId: shipment.trackingId,
        },
        theme: {
          color: "#6d5dfc",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2 className="section-title">Payment</h2>

      <div className="shipment-card" style={{ marginBottom: "1rem" }}>
        <p><strong>Tracking ID:</strong> {shipment.trackingId}</p>
        <p><strong>Current Payment Status:</strong> {shipment?.payment?.status || "PENDING"}</p>
      </div>

      <div className="form-grid">
        <div>
          <label className="label">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <div>
          <label className="label">Payment Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="PREPAID">Prepaid</option>
            <option value="COD">Cash on Delivery</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <button onClick={handlePayment} className="btn btn-primary" disabled={loading}>
          {loading ? "Processing..." : method === "COD" ? "Select COD" : "Pay Now"}
        </button>
      </div>
    </section>
  );
}