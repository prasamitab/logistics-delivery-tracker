import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function CustomerDashboard() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/api/shipments/customer/my-shipments");
        setShipments(res.data.shipments || []);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load customer shipments");
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, []);

  const sentPackages = shipments.filter((s) => s.isSender);
  const receivingPackages = shipments.filter((s) => s.isReceiver);

  const getStatusClass = (status) => {
    const value = (status || "").toLowerCase();

    if (value.includes("delivered")) return "status-delivered";
    if (value.includes("failed")) return "status-failed";
    if (
      value.includes("assigned") ||
      value.includes("picked") ||
      value.includes("transit") ||
      value.includes("delivery") ||
      value.includes("hub")
    ) {
      return "status-transit";
    }
    return "status-pending";
  };

  const renderShipmentCard = (shipment) => (
    <div key={shipment._id} className="shipment-card">
      <div className="shipment-card-top">
        <div>
          <p className="tracking-label">{shipment.trackingId}</p>
          <h3>{shipment.origin} → {shipment.destination}</h3>
        </div>
        <span className={`status-badge ${getStatusClass(shipment.currentStatus)}`}>
          {shipment.currentStatus}
        </span>
      </div>

      <p className="shipment-meta">
        Sender: {shipment.senderName} • Receiver: {shipment.receiverName}
      </p>

      <p className="shipment-meta">
        Delivery Address: {shipment.deliveryAddress || "N/A"}
      </p>

      <div className="inline-row" style={{ marginTop: "1rem", flexWrap: "wrap" }}>
        <Link
          to={`/track?trackingId=${shipment.trackingId}`}
          className="btn btn-secondary"
        >
          Track Shipment
        </Link>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="page-shell">
        <section className="panel-card">
          <h2 className="section-title">Loading customer dashboard...</h2>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <p className="status-badge status-transit">Customer Portal</p>
        <h1 className="hero-title" style={{ marginTop: "1rem" }}>
          My packages
        </h1>
        <p className="hero-subtitle">
          View packages you sent, packages you are receiving, and track every shipment.
        </p>

        <div className="inline-row" style={{ marginTop: "1rem", flexWrap: "wrap" }}>
          <Link to="/book" className="btn btn-primary">Send a Package</Link>
          <Link to="/track" className="btn btn-secondary">Track Shipment</Link>
        </div>
      </section>

      {error && <div className="message error">{error}</div>}

      <div className="dashboard-grid two-col">
        <section className="panel-card">
          <div className="section-header-row">
            <h2 className="section-title">Packages I Sent</h2>
            <span className="section-pill">{sentPackages.length}</span>
          </div>

          {sentPackages.length === 0 ? (
            <div className="empty-state-box">No sent packages found.</div>
          ) : (
            <div className="shipment-list">
              {sentPackages.map(renderShipmentCard)}
            </div>
          )}
        </section>

        <section className="panel-card">
          <div className="section-header-row">
            <h2 className="section-title">Packages I Am Receiving</h2>
            <span className="section-pill">{receivingPackages.length}</span>
          </div>

          {receivingPackages.length === 0 ? (
            <div className="empty-state-box">No incoming packages found.</div>
          ) : (
            <div className="shipment-list">
              {receivingPackages.map(renderShipmentCard)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}