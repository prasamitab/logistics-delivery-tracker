import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
    phone: "",
    vehicleNumber: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setLoading(true);

      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone,
        vehicleNumber: form.role === "driver" ? form.vehicleNumber : "",
      };

      const res = await api.post("/api/auth/register", payload);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setMessage("Registration successful");

      setTimeout(() => {
        if (res.data.user.role === "admin") {
          navigate("/admin");
        } else if (res.data.user.role === "driver") {
          navigate("/driver");
        } else {
          navigate("/customer");
        }
      }, 700);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-layout">
        <section className="login-showcase">
          <div>
            <p className="status-badge status-transit">Create account</p>
            <h1 className="hero-title" style={{ marginTop: "1rem", whiteSpace: "normal" }}>
              Join the shipment tracking workspace.
            </h1>
            <p className="hero-subtitle">
              Register as a customer to book and track parcels, as a driver to
              update deliveries, or as an admin to manage operations.
            </p>
          </div>

          <div className="login-kpis">
            <div className="login-kpi">
              <strong>Fast</strong>
              <span>Simple signup for new users</span>
            </div>
            <div className="login-kpi">
              <strong>Secure</strong>
              <span>JWT-based authentication flow</span>
            </div>
            <div className="login-kpi">
              <strong>Role-based</strong>
              <span>Admin, driver and customer separation</span>
            </div>
          </div>
        </section>

        <section className="login-form-card">
          <h2 className="section-title" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Sign up
          </h2>
          <p className="muted" style={{ marginBottom: "1.25rem" }}>
            Create your account to access the dashboard.
          </p>

          <form onSubmit={handleSubmit} className="grid" style={{ gap: "1rem" }}>
            <div className="form-group">
              <label>Full name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="customer">Customer</option>
                <option value="driver">Driver</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>

            {form.role === "driver" && (
              <div className="form-group">
                <label>Vehicle number</label>
                <input
                  name="vehicleNumber"
                  value={form.vehicleNumber}
                  onChange={handleChange}
                  placeholder="Enter vehicle number"
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}

          <div style={{ marginTop: "1rem" }}>
            <button
              className="btn btn-secondary"
              style={{ width: "100%" }}
              onClick={() => navigate("/login")}
              type="button"
            >
              Already have an account? Login
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}