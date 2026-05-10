import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5001/api";

export default function SupportTicketForm({ shipment, userId, onCreated }) {
  const [formData, setFormData] = useState({
    issueType: "MISSING",
    description: "",
    priority: "MEDIUM",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await axios.post(`${API_BASE}/support/create`, {
        trackingId: shipment.trackingId,
        createdBy: userId,
        issueType: formData.issueType,
        description: formData.description,
        priority: formData.priority,
      });

      alert("Support ticket created successfully");

      setFormData({
        issueType: "MISSING",
        description: "",
        priority: "MEDIUM",
      });

      onCreated && onCreated();
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to create support ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2 className="section-title">Report Issue / Contact Support</h2>

      <div className="shipment-card" style={{ marginBottom: "1rem" }}>
        <p><strong>Tracking ID:</strong> {shipment.trackingId}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label className="label">Issue Type</label>
            <select
              name="issueType"
              value={formData.issueType}
              onChange={handleChange}
            >
              <option value="MISSING">Missing Shipment</option>
              <option value="DELAYED">Delayed Delivery</option>
              <option value="DAMAGED">Damaged Package</option>
              <option value="WRONG_DELIVERY">Wrong Delivery</option>
              <option value="PAYMENT">Payment Issue</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="label">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <label className="label">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="5"
            placeholder="Describe the issue..."
            required
          />
        </div>

        <div style={{ marginTop: "1rem" }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Submitting..." : "Raise Ticket"}
          </button>
        </div>
      </form>
    </section>
  );
}