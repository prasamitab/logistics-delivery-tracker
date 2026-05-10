import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import BarcodeLabel from "../components/BarcodeLabel";

export default function DriverDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/shipments/driver/me/assignments", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setAssignments(res.data.shipments || res.data.assignments || []);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load assignments");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [token]);

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

  const activeAssignments = useMemo(() => {
    return assignments.filter(
      (shipment) => shipment.currentStatus !== "Delivered"
    );
  }, [assignments]);

  const completedAssignments = useMemo(() => {
    return assignments.filter(
      (shipment) => shipment.currentStatus === "Delivered"
    );
  }, [assignments]);

  const renderShipmentCard = (shipment, isCompleted = false) => (
    <div className="shipment-card" key={shipment._id}>
      <div className="shipment-card-top">
        <div>
          <p className="tracking-label">{shipment.trackingId}</p>
          <h3>
            {shipment.origin} → {shipment.destination}
          </h3>
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

      <p className="shipment-meta">
        Current Location: {shipment.currentLocation?.label || "Awaiting update"}
      </p>

      <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <BarcodeLabel value={shipment.trackingId} />
      </div>

      <div className="inline-row" style={{ flexWrap: "wrap" }}>
        {!isCompleted ? (
          <Link
            to={`/scan?trackingId=${shipment.trackingId}`}
            className="btn btn-primary"
          >
            Scan & Update Status
          </Link>
        ) : (
          <Link
            to={`/delivery-receipt/${shipment.trackingId}`}
            className="btn btn-secondary"
          >
            View Delivery Receipt
          </Link>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="page-shell">
        <section className="panel-card">
          <h2 className="section-title">Loading driver dashboard...</h2>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <p className="status-badge status-transit">Driver Operations</p>
        <h1 className="hero-title" style={{ marginTop: "1rem" }}>
          Driver dashboard
        </h1>
        <p className="hero-subtitle">
          View assigned shipments, verify parcel barcode, update delivery progress,
          and review completed deliveries.
        </p>
      </section>

      {error && <div className="message error">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <p>Total Assigned</p>
          <h3>{assignments.length}</h3>
        </div>
        <div className="stat-card">
          <p>Active</p>
          <h3>{activeAssignments.length}</h3>
        </div>
        <div className="stat-card">
          <p>Completed</p>
          <h3>{completedAssignments.length}</h3>
        </div>
      </div>

      <section className="panel-card">
        <div className="section-header-row">
          <h2 className="section-title">Active Shipments</h2>
          <span className="section-pill">{activeAssignments.length} active</span>
        </div>

        {activeAssignments.length === 0 ? (
          <div className="empty-state-box">No active shipments right now.</div>
        ) : (
          <div className="shipment-list">
            {activeAssignments.map((shipment) => renderShipmentCard(shipment, false))}
          </div>
        )}
      </section>

      <section className="panel-card" style={{ marginTop: "1.5rem" }}>
        <div className="section-header-row">
          <h2 className="section-title">Completed Shipments</h2>
          <span className="section-pill">{completedAssignments.length} delivered</span>
        </div>

        {completedAssignments.length === 0 ? (
          <div className="empty-state-box">No completed shipments yet.</div>
        ) : (
          <div className="shipment-list">
            {completedAssignments.map((shipment) => renderShipmentCard(shipment, true))}
          </div>
        )}
      </section>
    </div>
  );
}