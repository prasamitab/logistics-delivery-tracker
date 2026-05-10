import { useState } from "react";
import api from "../api";
import { saveAuth } from "../auth";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const { token, user } = res.data;
    
      const role = (user?.role || "").trim().toLowerCase();
    
      saveAuth(token, role);
    
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "driver") {
        navigate("/driver");
      } else {
        navigate("/customer");
      }
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-layout">
        <section className="login-showcase">
          <div>
            <p className="status-badge status-transit">Live Logistics Intelligence</p>
            <h1 className="hero-title">
              Track shipments.
              <br />
              See drivers live.
            </h1>

            <p className="hero-subtitle">
              Manage bookings, assign drivers, scan parcel milestones, and track
              deliveries on a live map from one modern dashboard.
            </p>

            <div className="login-kpis">
              <div className="login-kpi">
                <strong>24/7</strong>
                <span className="muted small">Shipment monitoring</span>
              </div>
              <div className="login-kpi">
                <strong>Live</strong>
                <span className="muted small">Map-based location updates</span>
              </div>
              <div className="login-kpi">
                <strong>Fast</strong>
                <span className="muted small">Driver scan workflow</span>
              </div>
            </div>
          </div>
        </section>

        <section className="login-form-card" aria-labelledby="login-heading">
          <h2
            id="login-heading"
            className="section-title"
            style={{ fontSize: "1.6rem", marginBottom: "0.4rem" }}
          >
            Sign in
          </h2>
          <p className="muted" style={{ marginTop: 0, marginBottom: "1.2rem" }}>
            Access admin controls, driver actions, or parcel tracking.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              Login to Dashboard
            </button>

            {message && (
              <div
                className="message error"
                role="alert"
                aria-live="assertive"
                style={{ marginTop: "0.8rem" }}
              >
                {message}
              </div>
            )}
          </form>

          <p
            className="muted small"
            style={{ marginTop: "1rem", textAlign: "center" }}
          >
            Don&apos;t have an account?{" "}
            <Link to="/register" style={{ color: "#7dd3fc", fontWeight: 600 }}>
              Register
            </Link>
          </p>

          <div className="quick-credentials" aria-label="Sample credentials">
            <div className="cred-box">
              <p><strong>Admin login</strong></p>
              <p className="muted small">Email: admin@example.com</p>
              <p className="muted small">Password: admin123</p>
            </div>

            <div className="cred-box">
              <p><strong>Driver login</strong></p>
              <p className="muted small">Email: rahul@example.com</p>
              <p className="muted small">Password: rahul123</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}