import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import BarcodeLabel from "../components/BarcodeLabel";

export default function AdminPage() {
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [ticketUpdates, setTicketUpdates] = useState({});
  const [activeTab, setActiveTab] = useState("bookings");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [shipmentRes, driverRes, ticketRes] = await Promise.all([
        api.get("/api/shipments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/api/drivers", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/api/support", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const shipmentList = shipmentRes.data.shipments || [];
      const driverList = driverRes.data.drivers || [];
      const ticketList = ticketRes.data.tickets || [];

      setShipments(shipmentList);
      setDrivers(driverList);
      setTickets(ticketList);

      if (shipmentList.length > 0) {
        setSelectedShipment((prev) => {
          if (!prev) return shipmentList[0];
          return shipmentList.find((item) => item._id === prev._id) || shipmentList[0];
        });
      } else {
        setSelectedShipment(null);
      }

      if (ticketList.length > 0) {
        setSelectedTicket((prev) => {
          if (!prev) return ticketList[0];
          return ticketList.find((item) => item._id === prev._id) || ticketList[0];
        });
      } else {
        setSelectedTicket(null);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const summary = useMemo(() => {
    const total = shipments.length;
    const bookings = shipments.filter(
      (s) => !s.assignedDriver || s.currentStatus === "Booked"
    ).length;
    const active = shipments.filter((s) =>
      [
        "Driver Assigned",
        "Picked Up",
        "At Origin Hub",
        "In Transit",
        "At Destination Hub",
        "Out for Delivery",
      ].includes(s.currentStatus)
    ).length;
    const delivered = shipments.filter((s) => s.currentStatus === "Delivered").length;
    const pending = shipments.filter((s) => s.currentStatus !== "Delivered").length;

    return { total, bookings, active, delivered, pending };
  }, [shipments]);

  const analytics = useMemo(() => {
    const driverMap = {};

    shipments.forEach((shipment) => {
      const driver = shipment.assignedDriver;
      if (!driver?._id) return;

      if (!driverMap[driver._id]) {
        driverMap[driver._id] = {
          driverId: driver._id,
          name: driver.name || "Unknown Driver",
          totalAssigned: 0,
          delivered: 0,
          pending: 0,
          active: 0,
        };
      }

      const currentDriver = driverMap[driver._id];
      currentDriver.totalAssigned += 1;

      if (shipment.currentStatus === "Delivered") {
        currentDriver.delivered += 1;
      } else {
        currentDriver.pending += 1;
      }

      if (
        [
          "Driver Assigned",
          "Picked Up",
          "At Origin Hub",
          "In Transit",
          "At Destination Hub",
          "Out for Delivery",
        ].includes(shipment.currentStatus)
      ) {
        currentDriver.active += 1;
      }
    });

    return Object.values(driverMap)
      .map((driver) => ({
        ...driver,
        completionRate:
          driver.totalAssigned > 0
            ? Math.round((driver.delivered / driver.totalAssigned) * 100)
            : 0,
      }))
      .sort((a, b) => b.completionRate - a.completionRate);
  }, [shipments]);

  const bookingShipments = useMemo(() => {
    return shipments.filter(
      (s) => !s.assignedDriver || s.currentStatus === "Booked"
    );
  }, [shipments]);

  const activeShipments = useMemo(() => {
    return shipments.filter((s) =>
      [
        "Driver Assigned",
        "Picked Up",
        "At Origin Hub",
        "In Transit",
        "At Destination Hub",
        "Out for Delivery",
      ].includes(s.currentStatus)
    );
  }, [shipments]);

  const deliveredShipments = useMemo(() => {
    return shipments.filter((s) => s.currentStatus === "Delivered");
  }, [shipments]);

  const handleAssign = async (shipmentId) => {
    const driverId = assignments[shipmentId];

    if (!driverId) {
      setError("Please select a driver before assigning");
      setSuccess("");
      return;
    }

    try {
      setActionLoading(shipmentId);
      setError("");
      setSuccess("");

      await api.put(
        `/shipments/${shipmentId}/assign-driver`,
        { driverId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess("Driver assigned successfully");
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to assign driver");
    } finally {
      setActionLoading("");
    }
  };

  const handleTicketUpdate = async (ticketId) => {
    const update = ticketUpdates[ticketId] || {};

    if (!update.status && !update.remark) {
      setError("Select a status or enter a remark before updating");
      setSuccess("");
      return;
    }

    try {
      setActionLoading(ticketId);
      setError("");
      setSuccess("");

      await api.put(
        `/support/${ticketId}`,
        {
          status: update.status,
          remark: update.remark,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess("Ticket updated successfully");
      setTicketUpdates((prev) => ({
        ...prev,
        [ticketId]: { status: "", remark: "" },
      }));
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update ticket");
    } finally {
      setActionLoading("");
    }
  };

  const getStatusClass = (status) => {
    const value = (status || "").toLowerCase();

    if (value.includes("delivered") || value.includes("resolved") || value.includes("closed")) {
      return "status-delivered";
    }
    if (value.includes("failed")) return "status-failed";
    if (
      value.includes("assigned") ||
      value.includes("picked") ||
      value.includes("transit") ||
      value.includes("delivery") ||
      value.includes("hub") ||
      value.includes("investigating") ||
      value.includes("review") ||
      value.includes("open") ||
      value.includes("escalated")
    ) {
      return "status-transit";
    }
    return "status-pending";
  };

  const renderShipmentCard = (shipment, showAssign = false) => (
    <div
      key={shipment._id}
      className="shipment-card clickable"
      onClick={() => setSelectedShipment(shipment)}
    >
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
        Package: {shipment.parcelType || "Parcel"} • {shipment.weight || 0} kg
      </p>

      <p className="shipment-meta">
        Pickup: {shipment.pickupAddress || "Not available"}
      </p>

      <p className="shipment-meta">
        Driver: {shipment.assignedDriver?.name || "Not assigned yet"}
      </p>

      {showAssign && (
        <div className="assign-row" onClick={(e) => e.stopPropagation()}>
          <select
            value={assignments[shipment._id] || ""}
            onChange={(e) =>
              setAssignments((prev) => ({
                ...prev,
                [shipment._id]: e.target.value,
              }))
            }
          >
            <option value="">Select driver</option>
            {drivers.map((driver) => (
              <option key={driver._id} value={driver._id}>
                {driver.name} {driver.phone ? `- ${driver.phone}` : ""}
              </option>
            ))}
          </select>

          <button
            className="btn btn-primary"
            onClick={() => handleAssign(shipment._id)}
            disabled={actionLoading === shipment._id}
          >
            {actionLoading === shipment._id ? "Assigning..." : "Assign"}
          </button>
        </div>
      )}
    </div>
  );

  const renderTicketCard = (ticket) => (
    <div
      key={ticket._id}
      className="shipment-card clickable"
      onClick={() => setSelectedTicket(ticket)}
    >
      <div className="shipment-card-top">
        <div>
          <p className="tracking-label">{ticket.ticketId}</p>
          <h3>{ticket.issueType}</h3>
        </div>
        <span className={`status-badge ${getStatusClass(ticket.status)}`}>
          {ticket.status}
        </span>
      </div>

      <p className="shipment-meta">Tracking ID: {ticket.trackingId}</p>
      <p className="shipment-meta">Priority: {ticket.priority}</p>
      <p className="shipment-meta">
        Customer: {ticket.createdBy?.name || "Unknown"} • {ticket.createdBy?.email || "No email"}
      </p>
      <p className="shipment-meta">
        {ticket.description?.length > 90
          ? `${ticket.description.slice(0, 90)}...`
          : ticket.description}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="page-shell">
        <section className="panel-card">
          <h2 className="section-title">Loading dispatch dashboard...</h2>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <p className="status-badge status-transit">Dispatch Control Center</p>
        <h1 className="hero-title" style={{ marginTop: "1rem" }}>
          Dispatch dashboard
        </h1>
        <p className="hero-subtitle">
          Monitor bookings, assign drivers, manage support tickets, and track deliveries in real time.
        </p>
      </section>

      <div className="stat-grid">
        <div className="stat-card">
          <p>Total Shipments</p>
          <h3>{summary.total}</h3>
        </div>
        <div className="stat-card">
          <p>Bookings</p>
          <h3>{summary.bookings}</h3>
        </div>
        <div className="stat-card">
          <p>Active</p>
          <h3>{summary.active}</h3>
        </div>
        <div className="stat-card">
          <p>Delivered</p>
          <h3>{summary.delivered}</h3>
        </div>
        <div className="stat-card">
          <p>Pending</p>
          <h3>{summary.pending}</h3>
        </div>
        <div className="stat-card">
          <p>Support Tickets</p>
          <h3>{tickets.length}</h3>
        </div>
      </div>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          Bookings
        </button>
        <button
          className={`admin-tab ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          Active
        </button>
        <button
          className={`admin-tab ${activeTab === "delivered" ? "active" : ""}`}
          onClick={() => setActiveTab("delivered")}
        >
          Delivered
        </button>
        <button
          className={`admin-tab ${activeTab === "support" ? "active" : ""}`}
          onClick={() => setActiveTab("support")}
        >
          Support
        </button>
      </div>

      <div className="dashboard-grid two-col">
        <section className="panel-card">
          {activeTab === "bookings" && (
            <>
              <div className="section-header-row">
                <h2 className="section-title">New Bookings</h2>
                <span className="section-pill">{bookingShipments.length} pending</span>
              </div>
              {bookingShipments.length === 0 ? (
                <div className="empty-state-box">No pending customer bookings.</div>
              ) : (
                <div className="shipment-list">
                  {bookingShipments.map((shipment) => renderShipmentCard(shipment, true))}
                </div>
              )}
            </>
          )}

          {activeTab === "active" && (
            <>
              <div className="section-header-row">
                <h2 className="section-title">Active Shipments</h2>
                <span className="section-pill">{activeShipments.length} moving</span>
              </div>
              {activeShipments.length === 0 ? (
                <div className="empty-state-box">No active shipments right now.</div>
              ) : (
                <div className="shipment-list">
                  {activeShipments.map((shipment) => renderShipmentCard(shipment, false))}
                </div>
              )}
            </>
          )}

          {activeTab === "delivered" && (
            <>
              <div className="section-header-row">
                <h2 className="section-title">Delivered Shipments</h2>
                <span className="section-pill">{deliveredShipments.length} completed</span>
              </div>
              {deliveredShipments.length === 0 ? (
                <div className="empty-state-box">No delivered shipments yet.</div>
              ) : (
                <div className="shipment-list">
                  {deliveredShipments.map((shipment) => renderShipmentCard(shipment, false))}
                </div>
              )}
            </>
          )}

          {activeTab === "support" && (
            <>
              <div className="section-header-row">
                <h2 className="section-title">Support Tickets</h2>
                <span className="section-pill">{tickets.length} total</span>
              </div>
              {tickets.length === 0 ? (
                <div className="empty-state-box">No support tickets available.</div>
              ) : (
                <div className="shipment-list">
                  {tickets.map((ticket) => renderTicketCard(ticket))}
                </div>
              )}
            </>
          )}
        </section>

        <section className="panel-card">
          {activeTab !== "support" ? (
            <>
              <h2 className="section-title">Shipment Preview</h2>

              {!selectedShipment ? (
                <div className="empty-state-box">
                  Select a shipment to preview sender, receiver, route, addresses,
                  and assignment details.
                </div>
              ) : (
                <div className="tracking-card" style={{ marginTop: "1rem" }}>
                  <p className="tracking-label">Tracking ID</p>
                  <h3 style={{ marginBottom: "1rem" }}>{selectedShipment.trackingId}</h3>

                  <div style={{ marginBottom: "1rem" }}>
                    <BarcodeLabel value={selectedShipment?.trackingId} />
                  </div>

                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Status</strong>
                      <span>{selectedShipment.currentStatus}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Support Status</strong>
                      <span>{selectedShipment.supportStatus || "NONE"}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Payment Status</strong>
                      <span>{selectedShipment.payment?.status || "PENDING"}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Estimated Delivery</strong>
                      <span>
                        {selectedShipment.estimatedDeliveryDate
                          ? new Date(selectedShipment.estimatedDeliveryDate).toLocaleString()
                          : "Not estimated yet"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <strong>Sender</strong>
                      <span>{selectedShipment.senderName}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Receiver</strong>
                      <span>{selectedShipment.receiverName}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Sender Phone</strong>
                      <span>{selectedShipment.senderPhone}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Receiver Phone</strong>
                      <span>{selectedShipment.receiverPhone}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Sender Email</strong>
                      <span>{selectedShipment.senderEmail || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Receiver Email</strong>
                      <span>{selectedShipment.receiverEmail || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Origin</strong>
                      <span>{selectedShipment.origin}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Destination</strong>
                      <span>{selectedShipment.destination}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Pickup Address</strong>
                      <span>{selectedShipment.pickupAddress || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Delivery Address</strong>
                      <span>{selectedShipment.deliveryAddress || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Package Type</strong>
                      <span>{selectedShipment.parcelType || "Parcel"}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Weight</strong>
                      <span>{selectedShipment.weight || 0} kg</span>
                    </div>
                    <div className="detail-item">
                      <strong>Assigned Driver</strong>
                      <span>{selectedShipment.assignedDriver?.name || "Not assigned yet"}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Current Location</strong>
                      <span>{selectedShipment.currentLocation?.label || "Awaiting update"}</span>
                    </div>
                  </div>

                  <div className="inline-row" style={{ marginTop: "1rem", flexWrap: "wrap" }}>
                    <Link
                      to={`/manifest/${selectedShipment.trackingId}`}
                      className="btn btn-secondary"
                    >
                      View Manifest
                    </Link>

                    {selectedShipment.currentStatus === "Delivered" && (
                      <Link
                        to={`/delivery-receipt/${selectedShipment.trackingId}`}
                        className="btn btn-primary"
                      >
                        View Delivery Receipt
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="section-title">Ticket Preview</h2>

              {!selectedTicket ? (
                <div className="empty-state-box">
                  Select a ticket to review issue type, customer details, and update status.
                </div>
              ) : (
                <div className="tracking-card" style={{ marginTop: "1rem" }}>
                  <p className="tracking-label">Ticket ID</p>
                  <h3 style={{ marginBottom: "1rem" }}>{selectedTicket.ticketId}</h3>

                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Tracking ID</strong>
                      <span>{selectedTicket.trackingId}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Issue Type</strong>
                      <span>{selectedTicket.issueType}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Status</strong>
                      <span>{selectedTicket.status}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Priority</strong>
                      <span>{selectedTicket.priority}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Customer Name</strong>
                      <span>{selectedTicket.createdBy?.name || "Unknown"}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Customer Email</strong>
                      <span>{selectedTicket.createdBy?.email || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Created At</strong>
                      <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Shipment Status</strong>
                      <span>{selectedTicket.shipment?.currentStatus || "Unknown"}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: "1rem" }}>
                    <strong>Description</strong>
                    <p style={{ marginTop: "0.5rem", opacity: 0.9 }}>
                      {selectedTicket.description}
                    </p>
                  </div>

                  <div style={{ marginTop: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                      Update Status
                    </label>
                    <select
                      value={ticketUpdates[selectedTicket.ticketId]?.status || ""}
                      onChange={(e) =>
                        setTicketUpdates((prev) => ({
                          ...prev,
                          [selectedTicket.ticketId]: {
                            ...prev[selectedTicket.ticketId],
                            status: e.target.value,
                          },
                        }))
                      }
                    >
                      <option value="">Select status</option>
                      <option value="OPEN">OPEN</option>
                      <option value="IN_REVIEW">IN_REVIEW</option>
                      <option value="INVESTIGATING">INVESTIGATING</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="ESCALATED">ESCALATED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  <div style={{ marginTop: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                      Admin Remark
                    </label>
                    <textarea
                      rows="4"
                      placeholder="Enter investigation note or resolution remark"
                      value={ticketUpdates[selectedTicket.ticketId]?.remark || ""}
                      onChange={(e) =>
                        setTicketUpdates((prev) => ({
                          ...prev,
                          [selectedTicket.ticketId]: {
                            ...prev[selectedTicket.ticketId],
                            remark: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div style={{ marginTop: "1rem" }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleTicketUpdate(selectedTicket.ticketId)}
                      disabled={actionLoading === selectedTicket.ticketId}
                    >
                      {actionLoading === selectedTicket.ticketId ? "Updating..." : "Update Ticket"}
                    </button>
                  </div>

                  {selectedTicket.adminRemarks?.length > 0 && (
                    <div style={{ marginTop: "1.5rem" }}>
                      <strong>Previous Remarks</strong>
                      <div style={{ marginTop: "0.75rem" }}>
                        {selectedTicket.adminRemarks.map((remark, index) => (
                          <div key={index} className="timeline-item">
                            <div className="muted small">
                              {new Date(remark.createdAt).toLocaleString()}
                            </div>
                            <div style={{ marginTop: "0.35rem" }}>{remark.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <section className="panel-card" style={{ marginTop: "1.5rem" }}>
        <div className="section-header-row">
          <h2 className="section-title">Driver Performance</h2>
          <span className="section-pill">{analytics.length} drivers</span>
        </div>

        {analytics.length === 0 ? (
          <div className="empty-state-box">No driver assignments yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              className="driver-performance-table"
              style={{ width: "100%", borderCollapse: "collapse" }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.75rem" }}>Driver</th>
                  <th style={{ textAlign: "left", padding: "0.75rem" }}>Total Assigned</th>
                  <th style={{ textAlign: "left", padding: "0.75rem" }}>Delivered</th>
                  <th style={{ textAlign: "left", padding: "0.75rem" }}>Active</th>
                  <th style={{ textAlign: "left", padding: "0.75rem" }}>Pending</th>
                  <th style={{ textAlign: "left", padding: "0.75rem" }}>Completion %</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((driver) => (
                  <tr key={driver.driverId}>
                    <td style={{ padding: "0.75rem" }}>{driver.name}</td>
                    <td style={{ padding: "0.75rem" }}>{driver.totalAssigned}</td>
                    <td style={{ padding: "0.75rem" }}>{driver.delivered}</td>
                    <td style={{ padding: "0.75rem" }}>{driver.active}</td>
                    <td style={{ padding: "0.75rem" }}>{driver.pending}</td>
                    <td style={{ padding: "0.75rem" }}>{driver.completionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}