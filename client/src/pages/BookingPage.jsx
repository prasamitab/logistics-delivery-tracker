import { useState } from "react";
import api from "../api";

export default function BookingPage() {
  const [form, setForm] = useState({
    senderName: "",
    senderPhone: "",
    senderEmail: "",
    receiverName: "",
    receiverPhone: "",
    receiverEmail: "",
    origin: "",
    destination: "",
    pickupAddress: "",
    deliveryAddress: "",
    parcelType: "Document",
    weight: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      senderName: "",
      senderPhone: "",
      senderEmail: "",
      receiverName: "",
      receiverPhone: "",
      receiverEmail: "",
      origin: "",
      destination: "",
      pickupAddress: "",
      deliveryAddress: "",
      parcelType: "Document",
      weight: "",
      notes: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSuccess("");

    if (
      !form.senderName.trim() ||
      !form.senderPhone.trim() ||
      !form.senderEmail.trim() ||
      !form.receiverName.trim() ||
      !form.receiverPhone.trim() ||
      !form.receiverEmail.trim() ||
      !form.origin.trim() ||
      !form.destination.trim() ||
      !form.pickupAddress.trim() ||
      !form.deliveryAddress.trim() ||
      !form.weight
    ) {
      setMessage("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        senderName: form.senderName,
        senderPhone: form.senderPhone,
        senderEmail: form.senderEmail,
        receiverName: form.receiverName,
        receiverPhone: form.receiverPhone,
        receiverEmail: form.receiverEmail,
        origin: form.origin,
        destination: form.destination,
        pickupAddress: form.pickupAddress,
        deliveryAddress: form.deliveryAddress,
        parcelType: form.parcelType,
        weight: form.weight,
        notes: form.notes,
      };

      const res = await api.post("/api/shipments/customer-booking", payload, {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      });

      setSuccess(
        res.data?.message ||
          `Shipment booked successfully. Tracking ID: ${res.data?.shipment?.trackingId || ""}`
      );
      resetForm();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <p className="status-badge status-transit">Customer Booking Portal</p>
        <h1 className="hero-title" style={{ marginTop: "1rem" }}>
          Book a shipment
        </h1>
        <p className="hero-subtitle">
          Enter sender, receiver, parcel, and address details to create a new shipment booking.
        </p>
      </section>

      {message && <div className="message error">{message}</div>}
      {success && <div className="message success">{success}</div>}

      <section className="panel-card">
        <h2 className="section-title">Shipment Booking Form</h2>

        <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Sender Name</label>
              <input
                type="text"
                name="senderName"
                value={form.senderName}
                onChange={handleChange}
                placeholder="Enter sender name"
                required
              />
            </div>

            <div className="detail-item">
              <label>Sender Phone</label>
              <input
                type="text"
                name="senderPhone"
                value={form.senderPhone}
                onChange={handleChange}
                placeholder="Enter sender phone"
                required
              />
            </div>

            <div className="detail-item">
              <label>Sender Email</label>
              <input
                type="email"
                name="senderEmail"
                value={form.senderEmail}
                onChange={handleChange}
                placeholder="Enter sender email"
                required
              />
            </div>

            <div className="detail-item">
              <label>Receiver Name</label>
              <input
                type="text"
                name="receiverName"
                value={form.receiverName}
                onChange={handleChange}
                placeholder="Enter receiver name"
                required
              />
            </div>

            <div className="detail-item">
              <label>Receiver Phone</label>
              <input
                type="text"
                name="receiverPhone"
                value={form.receiverPhone}
                onChange={handleChange}
                placeholder="Enter receiver phone"
                required
              />
            </div>

            <div className="detail-item">
              <label>Receiver Email</label>
              <input
                type="email"
                name="receiverEmail"
                value={form.receiverEmail}
                onChange={handleChange}
                placeholder="Enter receiver email"
                required
              />
            </div>

            <div className="detail-item">
              <label>Origin</label>
              <input
                type="text"
                name="origin"
                value={form.origin}
                onChange={handleChange}
                placeholder="Enter origin city"
                required
              />
            </div>

            <div className="detail-item">
              <label>Destination</label>
              <input
                type="text"
                name="destination"
                value={form.destination}
                onChange={handleChange}
                placeholder="Enter destination city"
                required
              />
            </div>

            <div className="detail-item">
              <label>Parcel Type</label>
              <select
                name="parcelType"
                value={form.parcelType}
                onChange={handleChange}
              >
                <option value="Document">Document</option>
                <option value="Parcel">Parcel</option>
                <option value="Fragile">Fragile</option>
                <option value="Electronics">Electronics</option>
              </select>
            </div>

            <div className="detail-item">
              <label>Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                placeholder="Enter package weight"
                min="0"
                step="0.1"
                required
              />
            </div>

            <div className="detail-item">
              <label>Pickup Address</label>
              <input
                type="text"
                name="pickupAddress"
                value={form.pickupAddress}
                onChange={handleChange}
                placeholder="Enter pickup address"
                required
              />
            </div>

            <div className="detail-item">
              <label>Delivery Address</label>
              <input
                type="text"
                name="deliveryAddress"
                value={form.deliveryAddress}
                onChange={handleChange}
                placeholder="Enter delivery address"
                required
              />
            </div>

            <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
              <label>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Special handling notes, landmarks, or instructions"
                rows="4"
              />
            </div>
          </div>

          <div className="inline-row" style={{ marginTop: "1.5rem", flexWrap: "wrap" }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Booking..." : "Book Shipment"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}