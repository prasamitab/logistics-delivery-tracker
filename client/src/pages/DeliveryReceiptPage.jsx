import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

export default function DeliveryReceiptPage() {
  const { trackingId } = useParams();
  const navigate = useNavigate();

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
          err.response?.data?.message || "Failed to load delivery receipt"
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
      <div className="page-shell receipt-page">
        <section className="panel-card">
          <h2 className="section-title">Loading delivery receipt...</h2>
        </section>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="page-shell receipt-page">
        <section className="panel-card">
          <h2 className="section-title">Delivery Receipt</h2>
          <div className="message error">
            {message || "Delivery receipt data not available"}
          </div>
          <div className="inline-row" style={{ marginTop: "1rem" }}>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </section>
      </div>
    );
  }

  const status = shipment.currentStatus || "Pending";
  const delivered = status.toLowerCase() === "delivered";

  const deliveredAt = shipment.deliveredAt
    ? new Date(shipment.deliveredAt).toLocaleString()
    : shipment.updatedAt
    ? new Date(shipment.updatedAt).toLocaleString()
    : "Not available";

  const driverName =
    shipment.assignedDriver?.name ||
    shipment.assignedDriver?.fullName ||
    shipment.assignedDriver?.username ||
    "Not assigned";

  const receiverName =
    shipment.receiverName || shipment.recipientName || "Not available";

  const deliveryAddress =
    shipment.deliveryAddress ||
    shipment.destinationAddress ||
    shipment.destination ||
    "Not available";

  return (
    <div className="page-shell receipt-page">
      <div className="hero-panel">
        <div className="tracking-label">Proof of Delivery</div>
        <h1 className="hero-title" style={{ marginTop: "1rem" }}>
          Delivery receipt
        </h1>
        <p className="hero-subtitle">
          View delivery completion details, consignee information, and shipment
          handover summary.
        </p>
      </div>

      <div className="panel-card">
        <div className="section-header-row">
          <h2 className="section-title">Receipt Summary</h2>
          <div
            className={`status-badge ${
              delivered ? "status-delivered" : "status-pending"
            }`}
          >
            {status}
          </div>
        </div>

        <div className="grid grid-2">
          <div className="shipment-card">
            <p className="tracking-label">Tracking ID</p>
            <h3>{shipment.trackingId || "Not available"}</h3>
          </div>

          <div className="shipment-card">
            <p className="tracking-label">Recipient</p>
            <h3>{receiverName}</h3>
          </div>

          <div className="shipment-card">
            <p className="tracking-label">Delivery Address</p>
            <h3>{deliveryAddress}</h3>
          </div>

          <div className="shipment-card">
            <p className="tracking-label">Delivered At</p>
            <h3>{deliveredAt}</h3>
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

          <div className="shipment-card">
            <p className="tracking-label">Driver / Courier</p>
            <h3>{driverName}</h3>
          </div>

          <div className="shipment-card">
            <p className="tracking-label">Parcel Condition</p>
            <h3>
              {delivered
                ? "Delivered in recorded condition"
                : "Awaiting confirmation"}
            </h3>
          </div>
        </div>

        <div
          className="panel-card"
          style={{ marginTop: "1rem", padding: "1rem" }}
        >
          <p className="tracking-label">Acknowledgement</p>
          <p className="shipment-meta">
            {delivered
              ? "This shipment has been marked as delivered and the proof-of-delivery summary is available."
              : "This shipment has not been fully delivered yet. Final delivery confirmation will appear after completion."}
          </p>
        </div>

        <div
          className="inline-row"
          style={{ marginTop: "1rem", flexWrap: "wrap", gap: "0.75rem" }}
        >
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>

          <a
            href={`http://localhost:8081/logistics-jsp/delivery-receipt?trackingId=${trackingId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            View Delivery Receipt
          </a>

          <a
            href={`http://localhost:8081/logistics-jsp/delivery-receipt?trackingId=${trackingId}&print=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Print Delivery Receipt
          </a>
        </div>
      </div>
    </div>
  );
}