import React, { useEffect, useState } from "react";
import axios from "axios";

import { API_BASE_URL } from "../auth";

const API_BASE = `${API_BASE_URL}/api`;

export default function MyTickets({ userId, refreshKey }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/support/user/${userId}`);
      setTickets(data.tickets || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTickets();
    }
  }, [userId, refreshKey]);

  return (
    <section className="panel">
      <h2 className="section-title">My Support Tickets</h2>

      {loading ? (
        <div className="timeline-item">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="timeline-item">
          <strong>No tickets raised yet</strong>
          <div className="muted small" style={{ marginTop: "0.45rem" }}>
            Your support requests will appear here.
          </div>
        </div>
      ) : (
        <div className="timeline-list">
          {tickets.map((ticket) => (
            <div className="timeline-item" key={ticket._id}>
              <div
                className="inline-row"
                style={{ justifyContent: "space-between", marginBottom: "0.5rem" }}
              >
                <strong>{ticket.ticketId}</strong>
                <span className="status-badge status-transit">{ticket.status}</span>
              </div>

              <p><strong>Tracking ID:</strong> {ticket.trackingId}</p>
              <p><strong>Issue:</strong> {ticket.issueType}</p>
              <p><strong>Priority:</strong> {ticket.priority}</p>
              <p><strong>Description:</strong> {ticket.description}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}