import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { getUserId } from "../auth";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

import PaymentSection from "../components/PaymentSection";
import SupportTicketForm from "../components/SupportTicketForm";
import MyTickets from "../components/MyTickets";

const defaultPosition = [20.5937, 78.9629];

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function getStatusClass(status) {
  if (!status) return "status-badge status-booked";
  const s = status.toLowerCase();

  if (s.includes("deliver")) return "status-badge status-delivered";
  if (s.includes("transit") || s.includes("hub") || s.includes("out")) {
    return "status-badge status-transit";
  }

  return "status-badge status-booked";
}

function FixMapSize({ center }) {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
      map.setView(center, 6);
    }, 150);
  }, [map, center]);

  return null;
}

export default function TrackShipmentPage() {
  const [trackingId, setTrackingId] = useState("");
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const userId = getUserId();

  const handleSearch = async (e) => {
    e.preventDefault();
    setMessage("");
    setData(null);

    if (!trackingId.trim()) {
      setMessage("Enter a tracking ID");
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/api/shipments/${trackingId.trim()}`);
      console.log("TRACK RESPONSE:", res.data);
      console.log("CURRENT LOCATION:", res.data?.shipment?.currentLocation);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Tracking failed");
    } finally {
      setLoading(false);
    }
  };

  const refreshShipment = async () => {
    if (!trackingId.trim()) return;

    try {
      const res = await api.get(`/api/shipments/${trackingId.trim()}`);
      setData(res.data);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  };

  const currentLoc = data?.shipment?.currentLocation;

  const hasCoords =
    currentLoc &&
    currentLoc.lat !== undefined &&
    currentLoc.lat !== null &&
    currentLoc.lng !== undefined &&
    currentLoc.lng !== null &&
    !Number.isNaN(Number(currentLoc.lat)) &&
    !Number.isNaN(Number(currentLoc.lng));

  const mapCenter = hasCoords
    ? [Number(currentLoc.lat), Number(currentLoc.lng)]
    : defaultPosition;

  return (
    <div>
      <section className="hero-card">
        <p className="status-badge status-delivered">Customer Tracking Portal</p>

        <h1 className="hero-title" style={{ marginTop: "0.8rem" }}>
          Every scan. Every stop. In real time.
        </h1>

        <p className="hero-subtitle">
          Enter your tracking ID to view current status, movement timeline, and
          live shipment location on the map.
        </p>

        <form onSubmit={handleSearch} style={{ marginTop: "1.2rem" }}>
          <div className="inline-row">
            <input
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Enter tracking ID e.g. LDT260400001"
              style={{ maxWidth: "360px" }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Tracking..." : "Track Shipment"}
            </button>
          </div>
        </form>

        {message && <div className="message error">{message}</div>}
      </section>

      {data && (
        <>
          <div className="track-grid">
            <section className="panel">
              <div
                className="inline-row"
                style={{ justifyContent: "space-between", marginBottom: "1rem" }}
              >
                <div>
                  <div className="muted small">Tracking ID</div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "1.25rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    {data.shipment?.trackingId}
                  </div>
                </div>

                <span className={getStatusClass(data.shipment?.currentStatus)}>
                  {data.shipment?.currentStatus || "Booked"}
                </span>
              </div>

              <div className="shipment-card" style={{ marginBottom: "1rem" }}>
                <p>
                  <strong>From:</strong> {data.shipment?.origin || "-"}
                </p>
                <p>
                  <strong>To:</strong> {data.shipment?.destination || "-"}
                </p>
                <p>
                  <strong>Sender:</strong> {data.shipment?.senderName || "-"}
                </p>
                <p>
                  <strong>Receiver:</strong> {data.shipment?.receiverName || "-"}
                </p>
                <p>
                  <strong>Driver:</strong>{" "}
                  {data.shipment?.assignedDriver?.name || "Not assigned"}
                </p>
                <p>
                  <strong>Payment Status:</strong>{" "}
                  {data.shipment?.payment?.status || "PENDING"}
                </p>
                <p>
                  <strong>Support Status:</strong>{" "}
                  {data.shipment?.supportStatus || "NONE"}
                </p>
              </div>

              {data.shipment?.currentStatus === "Delivered" && (
                <div style={{ marginBottom: "1rem" }}>
                  <Link
                    to={`/delivery-receipt/${data.shipment.trackingId}`}
                    className="btn btn-primary"
                  >
                    View Delivery Receipt
                  </Link>
                </div>
              )}

              <h2 className="section-title">Shipment Timeline</h2>

              <div className="timeline-list">
                {data.events && data.events.length > 0 ? (
                  data.events.map((ev) => (
                    <div className="timeline-item" key={ev._id}>
                      <div
                        className="inline-row"
                        style={{ justifyContent: "space-between" }}
                      >
                        <strong>{ev.status}</strong>
                        <span className="muted small">
                          {new Date(ev.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div
                        className="muted small"
                        style={{ marginTop: "0.45rem" }}
                      >
                        {ev.locationName || "Unknown location"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="timeline-item">
                    <strong>No tracking events found</strong>
                    <div className="muted small" style={{ marginTop: "0.45rem" }}>
                      This shipment has no movement updates yet.
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="panel map-card">
              <h2 className="section-title">Live Location View</h2>

              <div className="map-wrap">
                <MapContainer
                  center={mapCenter}
                  zoom={6}
                  scrollWheelZoom={false}
                  style={{ height: "100%", width: "100%" }}
                >
                  <FixMapSize center={mapCenter} />

                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {hasCoords && (
                    <Marker position={mapCenter} icon={markerIcon}>
                      <Popup>
                        <strong>{data.shipment?.trackingId}</strong>
                        <br />
                        {data.shipment?.currentStatus || "In Transit"}
                        <br />
                        {currentLoc?.label || "Current Location"}
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>

              {!hasCoords && (
                <div className="message error" style={{ marginTop: "1rem" }}>
                  Live coordinates are not available for this shipment yet.
                </div>
              )}
            </section>
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            <PaymentSection
              shipment={data.shipment}
              onRefresh={refreshShipment}
            />
          </div>

          {userId ? (
            <>
              <div style={{ marginTop: "1.5rem" }}>
                <SupportTicketForm
                  shipment={data.shipment}
                  userId={userId}
                  onCreated={refreshShipment}
                />
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                <MyTickets userId={userId} refreshKey={refreshKey} />
              </div>
            </>
          ) : (
            <div className="message error" style={{ marginTop: "1.5rem" }}>
              Login is required to raise and track support tickets.
            </div>
          )}
        </>
      )}
    </div>
  );
}