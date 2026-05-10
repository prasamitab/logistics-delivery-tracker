import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import BarcodeLabel from "../components/BarcodeLabel";

export default function ManifestPage() {
  const { trackingId } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchShipment = async () => {
      try {
        setLoading(true);
        setMessage("");

        const res = await api.get(`/shipments/${trackingId}`);
        const shipmentData = res.data?.shipment || res.data;
        setShipment(shipmentData || null);
      } catch (err) {
        console.error(err);
        setMessage(
          err.response?.data?.message || "Failed to load shipment manifest"
        );
      } finally {
        setLoading(false);
      }
    };

    if (trackingId) {
      fetchShipment();
    }
  }, [trackingId]);

  if (loading) {
    return (
      <div className="page-shell manifest-page">
        <section className="panel-card">
          <h2 className="section-title">Loading manifest...</h2>
        </section>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="page-shell manifest-page">
        <section className="panel-card">
          <h2 className="section-title">Shipment Manifest</h2>
          <div className="message error">
            {message || "Shipment data not available"}
          </div>
          <div className="inline-row" style={{ marginTop: "1rem" }}>
            <Link to="/admin" className="btn btn-secondary">
              Back to Admin
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const status = shipment.currentStatus || "Booked";

  const assignedDriver =
    shipment.assignedDriver?.name ||
    shipment.assignedDriver?.fullName ||
    shipment.assignedDriver?.username ||
    "Not assigned";

  const currentLocation =
    shipment.currentLocation?.label ||
    shipment.currentLocation?.name ||
    shipment.currentLocation ||
    "Pending movement";

  return (
    <div className="page-shell manifest-page">
      <div className="hero-panel">
        <div className="tracking-label">Dispatch Document</div>
        <h1 className="hero-title" style={{ marginTop: "1rem" }}>
          Shipment manifest
        </h1>
        <p className="hero-subtitle">
          Review shipment, consignee, route, parcel, and assignment details
          before handover and movement.
        </p>
      </div>

      <div className="grid grid-2">
        <div className="panel-card">
          <h2 className="section-title">Shipment Details</h2>
          <div className="shipment-list">
            <div className="shipment-card">
              <p className="tracking-label">Tracking ID</p>
              <h3>{shipment.trackingId || "Not available"}</h3>
            </div>

            <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
              <BarcodeLabel value={shipment.trackingId} />
            </div>

            <div className="shipment-card">
              <p className="tracking-label">Status</p>
              <div
                className={`status-badge status-${status
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {status}
              </div>
            </div>

            <div className="shipment-card">
              <p className="tracking-label">Parcel Type</p>
              <h3>{shipment.parcelType || "Parcel"}</h3>
            </div>

            <div className="shipment-card">
              <p className="tracking-label">Weight</p>
              <h3>
                {shipment.weight !== undefined && shipment.weight !== null
                  ? `${shipment.weight} kg`
                  : "Not available"}
              </h3>
            </div>
          </div>
        </div>

        <div className="panel-card">
          <h2 className="section-title">Route & Assignment</h2>
          <div className="shipment-list">
            <div className="shipment-card">
              <p className="tracking-label">Origin</p>
              <h3>{shipment.origin || "Not available"}</h3>
            </div>

            <div className="shipment-card">
              <p className="tracking-label">Destination</p>
              <h3>{shipment.destination || "Not available"}</h3>
            </div>

            <div className="shipment-card">
              <p className="tracking-label">Assigned Driver</p>
              <h3>{assignedDriver}</h3>
            </div>

            <div className="shipment-card">
              <p className="tracking-label">Current Location</p>
              <h3>{currentLocation}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-card" style={{ marginTop: "1rem" }}>
        <h2 className="section-title">Addresses</h2>
        <div className="grid grid-2">
          <div className="shipment-card">
            <p className="tracking-label">Pickup Address</p>
            <h3>
              {shipment.pickupAddress ||
                shipment.originAddress ||
                shipment.pickupLocation ||
                "Not available"}
            </h3>
          </div>

          <div className="shipment-card">
            <p className="tracking-label">Delivery Address</p>
            <h3>
              {shipment.deliveryAddress ||
                shipment.destinationAddress ||
                shipment.dropAddress ||
                "Not available"}
            </h3>
          </div>
        </div>
      </div>

      <div className="panel-card" style={{ marginTop: "1rem" }}>
        <h2 className="section-title">Parties</h2>
        <div className="grid grid-2">
          <div className="shipment-card">
            <p className="tracking-label">Sender</p>
            <h3>{shipment.senderName || "Not available"}</h3>
            <p className="shipment-meta">
              {shipment.senderPhone || "No sender phone"}
            </p>
          </div>

          <div className="shipment-card">
            <p className="tracking-label">Receiver</p>
            <h3>
              {shipment.receiverName ||
                shipment.recipientName ||
                "Not available"}
            </h3>
            <p className="shipment-meta">
              {shipment.receiverPhone || "No receiver phone"}
            </p>
          </div>
        </div>
      </div>

      <div
        className="inline-row"
        style={{ marginTop: "1rem", flexWrap: "wrap", gap: "0.75rem" }}
      >
        <Link to="/admin" className="btn btn-secondary">
          Back to Admin
        </Link>

        <a
          href={`http://localhost:8081/logistics-jsp/manifest?trackingId=${trackingId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          View Manifest
        </a>

        <a
          href={`http://localhost:8081/logistics-jsp/manifest?trackingId=${trackingId}&print=true`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Print Manifest
        </a>
      </div>
    </div>
  );
}